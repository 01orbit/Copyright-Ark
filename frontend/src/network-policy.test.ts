import { expect, it } from "vitest";
import { canUseLocalChain, resolveChain } from "./network-policy";

it("allows chain switching only on local hosts", () => {
  for (const hostname of ["localhost", "127.0.0.1", "[::1]", "192.168.1.8", "10.0.0.2", "172.16.0.5"]) {
    expect(canUseLocalChain(hostname), hostname).toBe(true);
  }
  for (const hostname of ["ark.pages.dev", "preview.ark.pages.dev", "copyright.example.com", "localhost.evil.com", "8.8.8.8"]) {
    expect(canUseLocalChain(hostname), hostname).toBe(false);
  }
});

it("locks Cloudflare builds to Sepolia even when previewed locally", () => {
  expect(canUseLocalChain("localhost", true)).toBe(false);
  expect(canUseLocalChain("copyright.example.com", true)).toBe(false);
  expect(resolveChain(31337, false)).toBe(11155111);
  expect(resolveChain(31337, true)).toBe(31337);
  expect(resolveChain(1, true)).toBe(11155111);
});
