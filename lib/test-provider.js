import { runWithCookieRetry } from "./cookie-manager.js";

export async function getTestStreams() {
  const cookies = [
    { remaining: 9000, shouldFail: true },
    { remaining: 6000, shouldFail: false }
  ];

  const result = await runWithCookieRetry(
    cookies,
    async (cookie, index) => {
      if (cookie.shouldFail) {
        throw new Error(`Simulated failure for cookie ${index + 1}`);
      }

      return {
        name: `Test Stream • Cookie ${index + 1}`,
        url: "https://example.com/test-stream"
      };
    }
  );

  return [result];
}