// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "../i18n";
import type { Work } from "../market";
import { OfferModal } from "./Offers";

const mocks = vi.hoisted(() => ({
  write: vi.fn(), run: vi.fn(), block: vi.fn(), receipt: vi.fn(),
  account: "0x1234567890123456789012345678901234567890",
}));
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: mocks.account }),
  usePublicClient: () => ({ getBlock: mocks.block, getTransactionReceipt: mocks.receipt }),
  useWriteContract: () => ({ writeContractAsync: mocks.write }),
  useReadContract: vi.fn(),
}));
vi.mock("../market", () => ({
  abi: [],
  useMarket: () => ({ address: mocks.account, chainId: 31337 }),
  useTransaction: () => ({ busy: false, message: "", run: mocks.run }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("CSS", { escape: (value: string) => value });
  mocks.block.mockResolvedValue({ timestamp: 1700000000n });
  mocks.receipt.mockResolvedValue(undefined);
  mocks.run.mockImplementation(async (send: () => Promise<string>) => {
    try { await send(); return true; } catch { return false; }
  });
  mocks.write.mockResolvedValue(`0x${"ab".repeat(32)}`);
});
afterEach(() => vi.unstubAllGlobals());

async function form() {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const close = vi.fn();
  await act(() => root.render(<LanguageProvider><OfferModal work={{ id: 1n, registrant: mocks.account } as Work} onClose={close} /></LanguageProvider>));
  const input = [...document.querySelectorAll<HTMLInputElement>("input")].find((input) => input.max === "20")!;
  async function quantity(value: string) {
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  const publish = () => [...document.querySelectorAll("button")].find((button) => /Lock deposit and publish|Continue remaining offers/.test(button.textContent ?? ""))!;
  return { close, input, quantity, publish, cleanup: async () => { await act(() => root.unmount()); host.remove(); } };
}

it("publishes identical independent offers, shows total deposits, and resumes after a rejected signature", async () => {
  const ui = await form();
  try {
    expect(ui.input.value).toBe("1");
    await ui.quantity("0");
    expect(ui.publish().disabled).toBe(true);
    await ui.quantity("21");
    expect(ui.publish().disabled).toBe(true);
    await ui.quantity("3");
    expect(document.body.textContent).toContain("Remaining deposits: 0.0036 ETH");
    mocks.write.mockResolvedValueOnce("0x01").mockRejectedValueOnce(new Error("User rejected"));
    await act(() => ui.publish().click());
    expect(mocks.write).toHaveBeenCalledTimes(2);
    expect(ui.close).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("Published 1 of 3 offers");
    expect(ui.input.closest("fieldset")!.disabled).toBe(true);
    expect(document.body.textContent).toContain("Remaining deposits: 0.0024 ETH");
    await act(() => ui.publish().click());
    expect(mocks.write).toHaveBeenCalledTimes(4);
    expect(ui.close).toHaveBeenCalledOnce();
    for (const [call] of mocks.write.mock.calls) {
      expect(call.value).toBe(1200000000000000n);
      expect(call.functionName).toBe("createOffer");
      expect(call.args).toEqual([1n, 1000000000000000n, 604800n, 200000000000000n, 1700086400n, "Classroom presentations and non-commercial research only"]);
    }
    expect(mocks.block).toHaveBeenCalledOnce();
  } finally { await ui.cleanup(); }
});

it("waits for the submitted transaction again after a receipt timeout instead of publishing a duplicate", async () => {
  const ui = await form();
  try {
    mocks.run.mockImplementationOnce(async (send: () => Promise<string>) => { await send(); return false; });
    await act(() => ui.publish().click());
    expect(mocks.write).toHaveBeenCalledOnce();
    expect(ui.close).not.toHaveBeenCalled();
    await act(() => ui.publish().click());
    expect(mocks.write).toHaveBeenCalledOnce();
    expect(ui.close).toHaveBeenCalledOnce();
  } finally { await ui.cleanup(); }
});
