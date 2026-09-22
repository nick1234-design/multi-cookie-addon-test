import { selectCookie } from "./cookie-manager.js";

export async function getTestStreams() {
  const cookies = [
  { remaining: 0 },
  { remaining: 6000 }
];

  const selected = await selectCookie(cookies);

  console.log(
    `[CookieManager] Cookie 1: ${cookies[0].remaining} MB remaining`
  );

  console.log(
    `[CookieManager] Cookie 2: ${cookies[1].remaining} MB remaining`
  );

  console.log(
    `[CookieManager] Selected cookie: ${selected.index + 1}`
  );

  return [
    {
      name: `Test Stream • Cookie ${selected.index + 1}`,
      url: "https://example.com/test-stream"
    }
  ];
}