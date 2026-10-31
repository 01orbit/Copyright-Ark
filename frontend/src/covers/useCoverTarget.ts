import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { useMarket, type Work } from "../market";
import { coverApi } from "./client";
import type { CoverTarget } from "../../../shared/cover-protocol";

export function useCoverTarget(work?: Pick<Work, "id" | "fileHash">): CoverTarget | undefined {
  const { chainId, address } = useMarket();
  const client = usePublicClient({ chainId });
  const { data: epoch } = useQuery({
    queryKey: ["cover-epoch", chainId, address],
    queryFn: async () => {
      if (chainId === 11155111) return "sepolia";
      const genesis = await client!.getBlock({ blockNumber: 0n });
      if (!genesis.hash) throw new Error("Local genesis unavailable");
      return genesis.hash;
    },
    enabled: !!coverApi && !!address && !!client,
    retry: 1,
  });
  return address && epoch && work ? { chainId, market: address, epoch, workId: String(work.id), fileHash: work.fileHash } : undefined;
}
