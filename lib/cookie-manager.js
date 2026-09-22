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

  statuses.sort((a, b) => b.remaining - a.remaining);

  return statuses[0];
}