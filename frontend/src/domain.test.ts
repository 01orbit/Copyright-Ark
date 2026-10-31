import { describe, expect, it } from "vitest";
import { formatDuration, formatEth, normalizeReferenceUrl, parseEthSafe, safeReferenceUrl, utf8Bytes, validateFile, validateReferenceUrl } from "./domain";

describe("domain validation", () => {
  it("keeps ETH values exact through bigint parsing", () => {
    expect(parseEthSafe("0.0012")).toBe(1200000000000000n);
    expect(formatEth(1200000000000000n)).toBe("0.0012");
  });
  it("shows short licenses in human-readable time units", () => {
    expect(formatDuration(3600n, "en-US")).toBe("1 hour");
    expect(formatDuration(60n, "en-US")).toBe("1 minute");
    expect(formatDuration(604800n, "en-US")).toBe("7 days");
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
  it("accepts optional public HTTP(S) references and rejects unsafe or oversized URLs", () => {
    expect(validateReferenceUrl("")).toBe("");
    expect(validateReferenceUrl("https://example.com/work")).toBe("");
    expect(validateReferenceUrl("javascript:alert(1)")).not.toBe("");
    expect(validateReferenceUrl(`https://example.com/${"a".repeat(250)}`)).not.toBe("");
    expect(safeReferenceUrl("javascript:alert(1)")).toBeUndefined();
    expect(normalizeReferenceUrl(" HTTPS://Example.com/work ")).toBe("https://example.com/work");
    expect(normalizeReferenceUrl("https://例子.测试/作品")).toContain("xn--");
    expect(normalizeReferenceUrl(`https://example.com/${"作品".repeat(40)}`)!.length).toBeGreaterThan(256);
  });
});
