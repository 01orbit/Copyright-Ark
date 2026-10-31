import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { injected } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";
import type { Address } from "viem";
import deployments from "./generated/deployments.json";
import { canUseLocalChain, resolveChain } from "./network-policy";

export const localChainEnabled = canUseLocalChain(
  window.location.hostname,
  import.meta.env.CLOUDFLARE_PAGES === "1",
);

const localRpc = import.meta.env.VITE_LOCAL_RPC_URL || "http://127.0.0.1:8545";
const sepoliaRpc =
  import.meta.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const records = deployments.deployments as Record<string, { address: Address }>;

export const hardhatLocal = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [localRpc] } },
});

export const defaultChainId = resolveChain(
  Number(import.meta.env.VITE_DEFAULT_CHAIN_ID || 11155111),
  localChainEnabled,
);
export const marketAddresses: Record<number, Address | undefined> = {
  31337: import.meta.env.VITE_LOCAL_MARKET_ADDRESS || records["31337"]?.address,
  11155111:
    import.meta.env.VITE_SEPOLIA_MARKET_ADDRESS || records["11155111"]?.address,
};

export const config = createConfig({
  chains: localChainEnabled ? [sepolia, hardhatLocal] : [sepolia],
  connectors: [injected({ target: "metaMask" })],
  transports: {
    [hardhatLocal.id]: http(localRpc),
    [sepolia.id]: http(sepoliaRpc, { timeout: 15_000, retryCount: 2 }),
  },
});

export function marketAddress(chainId = defaultChainId) {
  if (!localChainEnabled && chainId !== sepolia.id) return undefined;
  return marketAddresses[chainId];
}
