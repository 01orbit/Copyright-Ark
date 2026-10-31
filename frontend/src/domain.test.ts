import { describe, expect, it } from "vitest";
import { formatEth, parseEthSafe, utf8Bytes, validateFile } from "./domain";

describe("domain validation", () => {
  it("keeps ETH values exact through bigint parsing", () => {
    expect(parseEthSafe("0.0012")).toBe(1200000000000000n);
    expect(formatEth(1200000000000000n)).toBe("0.0012");
  });
  it("counts UTF-8 bytes rather than JavaScript characters", () => {
    expect(utf8Bytes("你好")).toBe(6);
    expect(utf8Bytes("a")).toBe(1);
  });
  it("rejects unsupported and oversized files", () => {
    expect(validateFile(new File(["x"], "demo.exe"))).toContain("不支持");
    expect(
      validateFile(new File([new Uint8Array(21 * 1024 * 1024)], "demo.png")),
    ).toContain("20 MiB");
  });
});
