// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import defaults from "./test-accounts.json";
import { loadAccounts, resetAccounts, saveAccounts, validateAccounts } from "./test-accounts";

beforeEach(() => localStorage.clear());

describe("test account configuration", () => {
  it("uses valid local defaults and never copies local accounts to Sepolia", () => {
    expect(validateAccounts(loadAccounts("31337"))).toEqual(defaults["31337"]);
    expect(loadAccounts("11155111")).toEqual({ admin: [], author: [], buyer: [] });
  });

  it("persists overrides without modifying defaults or another network", () => {
    const value = {
      ...defaults["31337"],
      admin: [defaults["31337"].buyer[0].toLowerCase()],
    };
    saveAccounts("11155111", value);
    expect(loadAccounts("11155111").admin).toEqual(defaults["31337"].buyer);
    expect(loadAccounts("31337")).toEqual(defaults["31337"]);
    expect(resetAccounts("11155111")).toEqual(defaults["11155111"]);
    expect(loadAccounts("11155111")).toEqual(defaults["11155111"]);
  });

  it("rejects private keys, zero addresses and malformed values without overwriting saved data", () => {
    saveAccounts("11155111", defaults["31337"]);
    for (const admin of [`0x${"ab".repeat(32)}`, `0x${"0".repeat(40)}`, "hello"]) {
      expect(() => saveAccounts("11155111", { ...defaults["31337"], admin: [admin] })).toThrow();
    }
    expect(loadAccounts("11155111")).toEqual(defaults["31337"]);
    expect(() => validateAccounts({ admin: 1 })).toThrow();
  });

  it("accepts multiple addresses and keeps old single-address overrides readable", () => {
    const second = "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199";
    const accounts = validateAccounts({
      admin: [defaults["31337"].admin[0], second, second.toLowerCase()],
      author: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      buyer: [],
    });
    expect(accounts.admin).toHaveLength(2);
    expect(accounts.author).toHaveLength(1);
    expect(validateAccounts({ admin: defaults["31337"].admin[0], author: "", buyer: "" })).toEqual({
      admin: defaults["31337"].admin,
      author: [],
      buyer: [],
    });
    localStorage.setItem(
      "copyright-dapp:test-accounts:v1:11155111",
      JSON.stringify({
        admin: defaults["31337"].admin[0],
        author: "",
        buyer: "",
      }),
    );
    expect(loadAccounts("11155111").admin).toEqual(defaults["31337"].admin);
  });

  it("recovers from corrupted saved data", () => {
    saveAccounts("31337", defaults["31337"]);
    localStorage.setItem(localStorage.key(0)!, "broken JSON");
    expect(loadAccounts("31337")).toEqual(defaults["31337"]);
    localStorage.setItem(localStorage.key(0)!, JSON.stringify({ admin: "garbage" }));
    expect(loadAccounts("31337")).toEqual(defaults["31337"]);
  });
});
