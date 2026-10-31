import { useReadContract, useReadContracts } from "wagmi";
import { abi, useMarket } from "../market";

// 合约每次最多返回 50 个编号，继续取完剩余页，避免历史记录增多后漏掉新挂单。
export function useRecordIds(
  subject: bigint | `0x${string}` | undefined,
  functionName: "getOfferIdsByWork" | "getLicenseIdsByWork" | "getOfferIdsBySeller" | "getWorkIdsByRegistrant",
) {
  const { address, chainId } = useMarket();
  const first = useReadContract({
    address, abi, functionName, chainId, args: [subject!, 0n, 50n],
    query: { enabled: !!address && subject !== undefined, refetchInterval: 10_000 },
  });
  const total = Number(first.data?.[1] ?? 0n);
  const rest = useReadContracts({
    contracts: Array.from({ length: Math.max(0, Math.ceil(total / 50) - 1) }, (_, index) => ({
      address: address!, abi, functionName, chainId,
      args: [subject!, BigInt((index + 1) * 50), 50n],
    } as const)),
    allowFailure: false,
    query: { enabled: !!address && subject !== undefined && total > 50, refetchInterval: 10_000 },
  });
  return {
    ids: [...(first.data?.[0] ?? []), ...(rest.data ?? []).flatMap((page) => page[0])],
    loading: first.isLoading || rest.isLoading,
    error: first.error || rest.error,
  };
}

