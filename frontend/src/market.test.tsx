// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { NetworkProvider, useNetwork } from "./market";

const switchChain = vi.hoisted(() => vi.fn());
vi.mock("./config", () => ({ localChainEnabled: false, defaultChainId: 31337, marketAddress: vi.fn() }));
vi.mock("wagmi", () => ({
  useAccount: () => ({ chainId: 31337, isConnected: true }),
  useSwitchChain: () => ({ switchChain, isPending: false }),
  usePublicClient: vi.fn(),
}));
afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

it("ignores a saved local chain and normalizes local-chain requests in hosted mode", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.setItem("copyright-ark:network", "31337");
  function Consumer() {
    const network = useNetwork();
    return <button onClick={() => network.selectChain(31337)}>{network.chainId}</button>;
  }
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    await act(() => root.render(
      <QueryClientProvider client={new QueryClient()}><NetworkProvider><Consumer /></NetworkProvider></QueryClientProvider>,
    ));
    expect(host.textContent).toBe("11155111");
    await act(() => host.querySelector("button")!.click());
    expect(host.textContent).toBe("11155111");
    expect(localStorage.getItem("copyright-ark:network")).toBe("11155111");
    expect(switchChain).toHaveBeenCalledWith({ chainId: 11155111 });
  } finally {
    await act(() => root.unmount());
  }
});
