import { artifacts, network } from "hardhat";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { isAddress, keccak256, zeroAddress } from "viem";
import { firstConfiguredAddress, loadTestAccounts } from "./test-accounts.js";

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const chain = await publicClient.getChainId();
if (chain !== 31337 && chain !== 11155111) throw new Error(`Unsupported chain ${chain}`);
const [deployer] = await viem.getWalletClients();
if (!deployer) throw new Error("请先在 contracts/.env 配置 DEPLOYER_PRIVATE_KEY，使用持有测试 ETH 的独立测试钱包。");
const configured = (await loadTestAccounts())[String(chain)];
const owner = process.env.INITIAL_ADMIN_ADDRESS ||
  (configured && firstConfiguredAddress(configured, "admin")) ||
  deployer.account.address;
if (!isAddress(owner) || owner === zeroAddress) throw new Error("INITIAL_ADMIN_ADDRESS 不是有效的管理员地址。");
if (await publicClient.getBalance({ address: deployer.account.address }) === 0n) {
  throw new Error("部署钱包余额为 0，请先领取测试 ETH 支付部署 Gas。");
}
const artifact = await artifacts.readArtifact("CopyrightMarket");
const hash = await deployer.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
  args: [owner, 100000000000000n, 50000000000000n],
});
console.log(`部署交易已提交：${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success" || !receipt.contractAddress) throw new Error("合约部署失败，请检查交易回执。");
const code = await publicClient.getBytecode({ address: receipt.contractAddress });
if (!code || code === "0x") throw new Error("部署地址没有合约代码。");
const deployment = {
  address: receipt.contractAddress,
  deploymentBlock: receipt.blockNumber.toString(),
  deploymentTxHash: receipt.transactionHash,
  runtimeCodeHash: keccak256(code),
  deployedAt: new Date().toISOString(),
  termsVersion: "CopyrightLicenseTerms/v1",
};
const dir=join(process.cwd(),"deployments"); await mkdir(dir,{recursive:true}); await writeFile(join(dir,`${chain}.json`),JSON.stringify({schemaVersion:1,chainId:chain,deployment},null,2));
console.log(JSON.stringify({chain,owner,...deployment},null,2));
if (chain === 11155111) console.log(`查看合约：https://sepolia.etherscan.io/address/${deployment.address}`);
