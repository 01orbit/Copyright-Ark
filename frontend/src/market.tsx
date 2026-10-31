import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import type { ContractFunctionReturnType, Hash } from "viem";
import { defaultChainId, marketAddress } from "./config";
import { copyrightMarketAbi } from "./generated/copyrightMarketAbi";

export const abi = copyrightMarketAbi;
export type Work = ContractFunctionReturnType<typeof abi, "view", "getWork">;
export type Offer = ContractFunctionReturnType<typeof abi, "view", "getOffer">;

export type SupportedChainId = 31337 | 11155111;
const chainStorageKey = "copyright-ark:network";

function readStoredChain(): SupportedChainId {
  try {
    const stored = Number(localStorage.getItem(chainStorageKey));
    if (stored === 31337 || stored === 11155111) return stored;
  } catch {
    // Fall back to the build configuration when browser storage is unavailable.
  }
  return defaultChainId === 31337 ? 31337 : 11155111;
}

type NetworkContextValue = {
  chainId: SupportedChainId;
  selectChain: (chainId: SupportedChainId) => void;
  switching: boolean;
  switchError?: string;
};

const NetworkContext = createContext<NetworkContextValue | undefined>(
  undefined,
);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainId] = useState<SupportedChainId>(readStoredChain);
  const { chainId: walletChainId, isConnected } = useAccount();
  const {
    switchChain,
    isPending: switching,
    error: switchError,
  } = useSwitchChain();
  const queries = useQueryClient();

  const selectChain = useCallback(
    (nextChainId: SupportedChainId) => {
      setChainId(nextChainId);
      try {
        localStorage.setItem(chainStorageKey, String(nextChainId));
      } catch {
        // The in-memory selection still works when storage is unavailable.
      }
      void queries.invalidateQueries();
      if (isConnected && walletChainId !== nextChainId) {
        switchChain({ chainId: nextChainId });
      }
    },
    [isConnected, queries, switchChain, walletChainId],
  );

  useEffect(() => {
    void queries.invalidateQueries();
  }, [chainId, queries]);

  return (
    <NetworkContext.Provider
      value={{
        chainId,
        selectChain,
        switching,
        switchError: switchError?.message,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const value = useContext(NetworkContext);
  if (!value) throw new Error("useNetwork must be used inside NetworkProvider");
  return value;
}

export function useMarket() {
  const { chainId } = useNetwork();
  const { chainId: walletChainId, isConnected } = useAccount();
  return {
    chainId,
    address: marketAddress(chainId),
    walletChainId,
    isConnected,
    walletReady: !isConnected || walletChainId === chainId,
  };
}

// 页面只描述交易内容，等待确认、反馈和数据刷新统一处理。
export function useTransaction() {
  const { chainId, walletChainId, isConnected } = useMarket();
  const client = usePublicClient({ chainId });
  const queries = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run(send: () => Promise<Hash>) {
    setBusy(true);
    setMessage("请在钱包中确认交易…");
    try {
      if (!isConnected) throw new Error("请先连接 MetaMask 钱包。");
      if (walletChainId !== chainId) {
        throw new Error("请先在 MetaMask 切换到当前选择的网络。");
      }
      if (!client) throw new Error("请先选择支持的网络");
      const hash = await send();
      setMessage("交易已提交，等待链上确认…");
      const receipt = await client.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("交易执行失败");
      await queries.invalidateQueries();
      setMessage("交易已确认");
      return true;
    } catch (error) {
      const failure = error as { shortMessage?: string; message?: string };
      setMessage(failure.shortMessage || failure.message || "交易失败，请重试");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, message, run };
}
