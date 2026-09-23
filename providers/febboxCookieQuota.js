// febboxCookieQuota.js
// Tracks per-cookie FebBox usage against a 10GB quota.
// Uses the existing FebBox client/auth code for quota requests
// so cookie authentication is handled the same way as other FebBox requests.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { getQuota } = require('./febbox/client');

const QUOTA_BYTES =
    parseInt(process.env.FEBBOX_COOKIE_QUOTA_BYTES, 10) ||
    (10 * 1024 * 1024 * 1024);

const RESET_HOURS =
    parseFloat(process.env.FEBBOX_COOKIE_QUOTA_RESET_HOURS) || 24;


/**
 * Ask FebBox for the real quota for one cookie.
 *
 * This intentionally uses the existing FebBox client instead of
 * duplicating the HTTP request here. That means cookie formatting,
 * headers, authentication and request handling all come from the
 * same code used by the rest of the FebBox provider.
 */
const fetchFebboxQuota = async (
    cookie,
    regionPreference = null,
    cookieIndex = null
) => {
    if (!cookie) {
        return null;
    }

    try {
        const quota = await getQuota({
            token: cookie
        });

        if (!quota) {
            console.warn(
                `[CookieQuota] No quota returned for cookie ${cookieIndex ?? '?'}`
            );

            return null;
        }

        const usageMb = Number(quota.usageMB);
        const limitMb = Number(quota.limitMB);

        if (
            !Number.isFinite(usageMb) ||
            !Number.isFinite(limitMb)
        ) {
            console.warn(
                `[CookieQuota] Invalid quota data for cookie ${cookieIndex ?? '?'}`
            );

            return null;
        }

        console.log(
            `[CookieQuota] Cookie ${cookieIndex ?? '?'}: ` +
            `${(usageMb / 1024).toFixed(2)} MB used / ` +
            `${(limitMb / 1024).toFixed(2)} MB limit`
        );

        return {
            usageBytes: usageMb * 1024 * 1024,
            limitBytes: limitMb * 1024 * 1024,
            remainingBytes:
                (limitMb - usageMb) * 1024 * 1024,
            isVip: quota.isVip
        };

    } catch (error) {
        console.warn(
            `[CookieQuota] Quota lookup failed for cookie ${cookieIndex ?? '?'}: ${error.message}`
        );

        return null;
    }
};


const STORE_PATH = path.join(
    __dirname,
    'febbox_cookie_quota.json'
);

let state = null;


/**
 * Hash the cookie so we never store the actual cookie value
 * in the local quota state file.
 */
function cookieKey(cookie) {
    return crypto
        .createHash('sha1')
        .update(cookie)
        .digest('hex')
        .slice(0, 16);
}


function loadState() {
    if (state) {
        return state;
    }

    try {
        const raw = fs.readFileSync(
            STORE_PATH,
            'utf-8'
        );

        state = JSON.parse(raw);
    } catch (e) {
        state = {};
    }

    return state;
}


function saveState() {
    try {
        const tmpPath = STORE_PATH + '.tmp';

        fs.writeFileSync(
            tmpPath,
            JSON.stringify(state, null, 2),
            'utf-8'
        );

        fs.renameSync(
            tmpPath,
            STORE_PATH
        );

    } catch (e) {
        console.warn(
            `[CookieQuota] Failed to persist quota state: ${e.message}`
        );
    }
}


function getEntry(cookie) {
    const s = loadState();
    const key = cookieKey(cookie);
    const now = Date.now();

    let entry = s[key];

    if (
        !entry ||
        (now - entry.windowStart) >
        RESET_HOURS * 60 * 60 * 1000
    ) {
        entry = {
            usedBytes: 0,
            windowStart: now
        };

        s[key] = entry;
    }

    return entry;
}


/**
 * Local fallback picker.
 */
function pickCookie(cookies) {
    if (!cookies || cookies.length === 0) {
        return null;
    }

    let best = null;
    let bestUsed = Infinity;

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const entry = getEntry(cookie);

        if (entry.usedBytes < QUOTA_BYTES) {
            console.log(
                `[CookieQuota] Local fallback selected cookie ${i + 1} of ${cookies.length} ` +
                `(${(entry.usedBytes / 1e9).toFixed(2)}GB / ` +
                `${(QUOTA_BYTES / 1e9).toFixed(0)}GB used)`
            );

            return cookie;
        }

        if (entry.usedBytes < bestUsed) {
            best = cookie;
            bestUsed = entry.usedBytes;
        }
    }

    console.warn(
        `[CookieQuota] All ${cookies.length} cookies are at/over local quota. ` +
        `Falling back to least-used cookie.`
    );

    return best;
}


/**
 * Record known stream usage against a cookie.
 */
function recordUsage(cookie, bytes) {
    if (
        !cookie ||
        !bytes ||
        isNaN(bytes) ||
        bytes <= 0
    ) {
        return;
    }

    const entry = getEntry(cookie);

    entry.usedBytes += bytes;

    saveState();

    console.log(
        `[CookieQuota] +${(bytes / 1e9).toFixed(2)}GB on cookie ` +
        `${cookieKey(cookie)} -> ` +
        `${(entry.usedBytes / 1e9).toFixed(2)}GB total`
    );
}


/**
 * Mark a cookie as exhausted.
 */
function markExhausted(cookie) {
    if (!cookie) {
        return;
    }

    const entry = getEntry(cookie);

    entry.usedBytes = QUOTA_BYTES;

    saveState();

    console.warn(
        `[CookieQuota] Cookie ${cookieKey(cookie)} marked EXHAUSTED.`
    );
}


/**
 * Inspect local quota state.
 */
function getStatus(cookies = []) {
    return cookies.map(cookie => {
        const entry = getEntry(cookie);

        return {
            cookie: cookieKey(cookie),
            usedGB: +(
                entry.usedBytes / 1e9
            ).toFixed(2),

            quotaGB: +(
                QUOTA_BYTES / 1e9
            ).toFixed(2),

            resetsInHours: +(
                (
                    RESET_HOURS * 60 * 60 * 1000 -
                    (Date.now() - entry.windowStart)
                ) / 3.6e6
            ).toFixed(1)
        };
    });
}


/**
 * Check every configured cookie against the REAL FebBox quota.
 *
 * The cookie with the most remaining quota is selected.
 *
 * If some cookies cannot be checked, they are ignored rather
 * than pretending that their quota is 0GB used.
 */
const pickCookieByFebboxQuota = async (
    cookies,
    regionPreference = null
) => {
    if (
        !Array.isArray(cookies) ||
        cookies.length === 0
    ) {
        return null;
    }

    const quotaResults = [];

    for (
        let i = 0;
        i < cookies.length;
        i++
    ) {
        const cookie = cookies[i];

        console.log(
            `[CookieQuota] Checking cookie ${i + 1} of ${cookies.length}`
        );

        const quota = await fetchFebboxQuota(
            cookie,
            regionPreference,
            i + 1
        );

        if (quota) {
            quotaResults.push({
                cookie,
                index: i,
                usedBytes: quota.usageBytes,
                limitBytes: quota.limitBytes,
                remainingBytes: quota.remainingBytes
            });
        }
    }


    /**
     * If none of the cookies could be checked through
     * the real FebBox quota endpoint, use the local
     * tracking fallback.
     */
    if (quotaResults.length === 0) {
        console.warn(
            '[CookieQuota] Could not read FebBox quota for any cookie. ' +
            'Falling back to local picker.'
        );

        return pickCookie(cookies);
    }


    /**
     * Select the cookie with the most remaining quota.
     */
    const selectedCookie = quotaResults.reduce(
        (best, current) => {
            if (
                current.remainingBytes >
                best.remainingBytes
            ) {
                return current;
            }

            return best;
        }
    );


    console.log(
        `[CookieQuota] Selected cookie ` +
        `${selectedCookie.index + 1} of ${cookies.length} ` +
        `with ${(selectedCookie.usedBytes / (1024 ** 3)).toFixed(2)} GB used ` +
        `and ${(selectedCookie.remainingBytes / (1024 ** 3)).toFixed(2)} GB remaining.`
    );


    return selectedCookie.cookie;
};


module.exports = {
    pickCookie,
    pickCookieByFebboxQuota,
    recordUsage,
    markExhausted,
    getStatus,
    QUOTA_BYTES
};