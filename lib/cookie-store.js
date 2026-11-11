const Redis = require("ioredis");
const crypto = require("crypto");

const COOKIE_KEY = "multi-cookie-addon-test:febbox:cookies";
const PASS_KEY = "multi-cookie-addon-test:config:passhash";

function makeClient() {
  if (!process.env.REDIS_URL) {
    throw new Error("Persistent storage is not connected. Add REDIS_URL (your Redis/Upstash connection URL) in Vercel. FebBox cookies themselves are entered on the configuration page, not in Vercel.");
  }
  return new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    connectTimeout: 10000,
    ...(process.env.REDIS_URL.startsWith("rediss://") ? { tls: {} } : {})
  });
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

function makePasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return salt + ":" + hashPassword(password, salt);
}

function verifyPassword(password, record) {
  const [salt, expected] = String(record || "").split(":");
  if (!salt || !expected) return false;
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  const target = Buffer.from(expected, "hex");
  return actual.length === target.length && crypto.timingSafeEqual(actual, target);
}

async function getStatus() {
  const redis = makeClient();
  try {
    await redis.connect();
    const [raw, pass] = await Promise.all([redis.get(COOKIE_KEY), redis.get(PASS_KEY)]);
    let cookies = [];
    try { cookies = raw ? JSON.parse(raw) : []; } catch (_) {}
    return { initialized: Boolean(pass), cookieCount: Array.isArray(cookies) ? cookies.filter(Boolean).length : 0 };
  } finally {
    redis.disconnect();
  }
}

async function saveCookies({ password, cookie1, cookie2 }) {
  const redis = makeClient();
  try {
    await redis.connect();
    let record = await redis.get(PASS_KEY);
    if (!record) {
      if (!password || password.length < 10) {
        throw new Error("Create a configuration password with at least 10 characters.");
      }
      const created = await redis.set(PASS_KEY, makePasswordRecord(password), "NX");
      record = await redis.get(PASS_KEY);
      if (!created && !verifyPassword(password, record)) {
        throw new Error("Configuration password is already set. Enter the existing password.");
      }
    } else if (!verifyPassword(password, record)) {
      throw new Error("Incorrect configuration password.");
    }

    const cookies = [cookie1, cookie2]
      .map(value => String(value || "").trim().replace(/^ui=/i, ""))
      .filter(Boolean)
      .slice(0, 2);
    if (!cookies.length) throw new Error("Enter at least one FebBox cookie token.");
    await redis.set(COOKIE_KEY, JSON.stringify(cookies));
    return { cookieCount: cookies.length };
  } finally {
    redis.disconnect();
  }
}

async function getCookies() {
  const redis = makeClient();
  try {
    await redis.connect();
    const raw = await redis.get(COOKIE_KEY);
    if (!raw) return [];
    const values = JSON.parse(raw);
    return Array.isArray(values) ? values.filter(v => typeof v === "string" && v.trim()).slice(0, 2) : [];
  } finally {
    redis.disconnect();
  }
}

module.exports = { getStatus, saveCookies, getCookies };
