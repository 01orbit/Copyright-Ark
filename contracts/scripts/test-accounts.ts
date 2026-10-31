import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAddress, isAddress, zeroAddress, type Address } from "viem";

export type TestRole = "admin" | "author" | "buyer";
export type TestAccounts = Record<TestRole, Address[]>;

const roles: TestRole[] = ["admin", "author", "buyer"];

export async function loadTestAccounts() {
  const value: unknown = JSON.parse(
    await readFile(join(process.cwd(), "test-accounts.json"), "utf8"),
  );
  if (!value || typeof value !== "object") {
    throw new Error("contracts/test-accounts.json 格式错误。");
  }
  const result: Record<string, TestAccounts> = {};
  for (const [chain, rawChain] of Object.entries(value)) {
    if (!rawChain || typeof rawChain !== "object") {
      throw new Error(`${chain} 测试地址配置格式错误。`);
    }
    const accounts = {} as TestAccounts;
    for (const role of roles) {
      const raw = (rawChain as Record<string, unknown>)[role];
      const addresses =
        typeof raw === "string"
          ? raw.split(/[\s,]+/).filter(Boolean)
          : Array.isArray(raw)
            ? raw
            : null;
      if (!addresses || addresses.some((address) => typeof address !== "string")) {
        throw new Error(`${chain} 的 ${role} 测试地址格式错误。`);
      }
      const normalized = addresses.map((address) => {
        const trimmed = address.trim();
        if (!isAddress(trimmed) || trimmed.toLowerCase() === zeroAddress) {
          throw new Error(`${chain} 的 ${role} 必须填写有效公开地址。`);
        }
        return getAddress(trimmed);
      });
      accounts[role] = [
        ...new Map(normalized.map((address) => [address.toLowerCase(), address])).values(),
      ];
    }
    result[chain] = accounts;
  }
  return result;
}

export function firstConfiguredAddress(
  accounts: TestAccounts,
  role: TestRole,
) {
  return accounts[role][0];
}
