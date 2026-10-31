import { network } from "hardhat";

// Only reads network data: no key, signature or test ETH is required.
try {
  const { viem } = await network.connect();
  const client = await viem.getPublicClient();
  const chainId = await client.getChainId();
  if (chainId !== 11155111) throw new Error(`连接到了错误网络：${chainId}`);
  const block = await client.getBlock();
  console.log(`Sepolia RPC 连接成功，Chain ID：${chainId}`);
  console.log(`最新区块：${block.number}，区块时间：${new Date(Number(block.timestamp) * 1000).toISOString()}`);
} catch {
  console.error("Sepolia RPC 检查失败。请检查网络连接、SEPOLIA_RPC_URL 和网络是否为 Sepolia（11155111）。公共 RPC 不可用时可替换地址后重试。");
  process.exitCode = 1;
}
