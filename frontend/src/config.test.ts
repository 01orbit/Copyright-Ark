// @vitest-environment jsdom
// @vitest-environment-options {"url":"http://localhost:5173"}
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("registers only Sepolia and ignores a local default in Cloudflare builds", async () => {
  vi.stubEnv("CLOUDFLARE_PAGES", "1");
  vi.stubEnv("VITE_DEFAULT_CHAIN_ID", "31337");
  const config = await import("./config");
  expect(config.localChainEnabled).toBe(false);
  expect(config.defaultChainId).toBe(11155111);
  expect(config.config.chains.map((chain) => chain.id)).toEqual([11155111]);
  expect(config.marketAddress(31337)).toBeUndefined();
});

it("keeps both chains available for a local frontend", async () => {
  vi.stubEnv("CLOUDFLARE_PAGES", "");
  vi.stubEnv("VITE_DEFAULT_CHAIN_ID", "31337");
  const config = await import("./config");
  expect(config.localChainEnabled).toBe(true);
  expect(config.defaultChainId).toBe(31337);
  expect(config.config.chains.map((chain) => chain.id)).toEqual([11155111, 31337]);
});
