import { getAddress, isAddress, zeroAddress } from "viem";
import defaults from "./test-accounts.json";

export type TestAccounts = { admin: string[] };
export type TestChain = keyof typeof defaults;
const storageKey = (chain: TestChain) => `copyright-dapp:test-accounts:v1:${chain}`;

export function validateAccounts(value: unknown): TestAccounts {
  if (!value || typeof value !== "object") throw new Error("测试配置格式错误。");
  const raw = (value as Record<string, unknown>).admin;
  const addresses =
    typeof raw === "string"
      ? raw.split(/[\s,]+/).filter(Boolean)
      : Array.isArray(raw)
        ? raw
        : null;
  if (!addresses || addresses.some((address) => typeof address !== "string")) {
    throw new Error("管理员地址格式错误。");
  }
  const normalized = addresses.map((address) => {
    const trimmed = address.trim();
    if (!trimmed || !isAddress(trimmed) || trimmed.toLowerCase() === zeroAddress) {
      throw new Error("管理员须填写有效钱包地址，或留空；不要填写私钥。");
    }
    return getAddress(trimmed);
  });
  return {
    admin: [...new Map(normalized.map((address) => [address.toLowerCase(), address])).values()],
  };
}

function defaultAccounts(chain: TestChain) {
  return validateAccounts(defaults[chain]);
}

export function loadAccounts(chain: TestChain): TestAccounts {
  try {
    const saved = localStorage.getItem(storageKey(chain));
    if (saved) return validateAccounts(JSON.parse(saved));
  } catch {
    // Invalid or inaccessible browser storage falls back to the checked-in defaults.
  }
  return defaultAccounts(chain);
}

export function saveAccounts(chain: TestChain, value: TestAccounts) {
  const accounts = validateAccounts(value);
  localStorage.setItem(storageKey(chain), JSON.stringify(accounts));
  return accounts;
}

export function resetAccounts(chain: TestChain) {
  localStorage.removeItem(storageKey(chain));
  return defaultAccounts(chain);
}
