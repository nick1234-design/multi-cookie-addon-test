export async function getCookieStatus(cookie, index) {
  return {
    index,
    remaining: cookie.remaining
  };
}

export async function selectCookie(cookies) {
  if (!cookies || cookies.length === 0) {
    throw new Error("No cookies configured");
  }

  const statuses = await Promise.all(
    cookies.map((cookie, index) =>
      getCookieStatus(cookie, index)
    )
  );

  // Highest remaining quota first
  statuses.sort((a, b) => b.remaining - a.remaining);

  return statuses[0];
}

export async function runWithCookieRetry(cookies, operation) {
  if (!cookies || cookies.length === 0) {
    throw new Error("No cookies configured");
  }

  const statuses = await Promise.all(
    cookies.map((cookie, index) =>
      getCookieStatus(cookie, index)
    )
  );

  // Try the cookie with the most remaining quota first
  statuses.sort((a, b) => b.remaining - a.remaining);

  let lastError;

  for (const status of statuses) {
    try {
      console.log(
        `[CookieManager] Trying cookie ${status.index + 1}`
      );

      const result = await operation(
        cookies[status.index],
        status.index
      );

      console.log(
        `[CookieManager] Cookie ${status.index + 1} succeeded`
      );

      return result;
    } catch (error) {
      lastError = error;

      console.log(
        `[CookieManager] Cookie ${status.index + 1} failed, trying next cookie`
      );
    }
  }

  throw lastError || new Error("All cookies failed");
}