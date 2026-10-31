// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useRecordIds } from "./useRecordIds";

const queries = vi.hoisted(() => ({ rest: vi.fn() }));
vi.mock("../market", () => ({ abi: [], useMarket: () => ({ address: "0x1234", chainId: 31337 }) }));
vi.mock("wagmi", () => ({
  useReadContract: () => ({ data: [Array.from({ length: 50 }, (_, i) => BigInt(i + 1)), 103n] }),
  useReadContracts: (options: unknown) => {
    queries.rest(options);
    return { data: [
      [Array.from({ length: 50 }, (_, i) => BigInt(i + 51)), 103n],
      [[101n, 102n, 103n], 103n],
    ] };
  },
}));

it("reads every contract page for a seller with more than 50 offers", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  let ids: bigint[] = [];
  function Consumer() {
    ids = useRecordIds("0x1234", "getOfferIdsBySeller").ids;
    return null;
  }
  const root = createRoot(document.createElement("div"));
  try {
    await act(() => root.render(<Consumer />));
    expect(ids).toHaveLength(103);
    expect(ids[102]).toBe(103n);
    expect(queries.rest.mock.calls[0][0].contracts.map((query: { args: unknown[] }) => query.args)).toEqual([
      ["0x1234", 50n, 50n], ["0x1234", 100n, 50n],
    ]);
  } finally {
    await act(() => root.unmount());
    vi.unstubAllGlobals();
  }
});
