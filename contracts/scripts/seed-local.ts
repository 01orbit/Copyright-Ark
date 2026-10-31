import { network } from "hardhat";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { keccak256 } from "viem";
import { loadTestAccounts, type TestRole } from "./test-accounts.js";

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
if (await publicClient.getChainId() !== 31337) throw new Error("seed-local only runs on chain 31337");
const clients = await viem.getWalletClients();
const configured = (await loadTestAccounts())["31337"];
if (!configured) throw new Error("contracts/test-accounts.json 缺少 31337 配置。");
function clientFor(role: TestRole, fallbackIndex: number) {
  const client = configured[role]
    .map((address) => clients.find((item) => item.account.address.toLowerCase() === address.toLowerCase()))
    .find(Boolean);
  return client || clients[fallbackIndex];
}
const admin = clientFor("admin", 0);
const seller = clientFor("author", 1);
if (!admin || !seller) throw new Error("本地链没有足够的测试钱包。");
const market = await viem.deployContract("CopyrightMarket", [admin.account.address, 100000000000000n, 50000000000000n]);
await market.write.fundRewardPool({value: 10000000000000000n});
const hash = `0x${"11".repeat(32)}` as `0x${string}`;
await market.write.registerWork([hash,"示例城市海报","课堂演示作品",1,0],{account:seller.account});
const now = BigInt(Math.floor(Date.now()/1000));
await market.write.createOffer([1,1000000000000000n,7n*24n*60n*60n,200000000000000n,now+86400n,"仅限课堂展示和非商业研究"],{account:seller.account,value:1200000000000000n});
const block = await publicClient.getBlock({includeTransactions:true});
const code = await publicClient.getBytecode({address:market.address});
const tx = (block.transactions as readonly any[]).find((item:any)=>typeof item==='object' && item.to===null && item.from?.toLowerCase()===admin.account.address.toLowerCase());
await mkdir(join(process.cwd(),"deployments"),{recursive:true});
await writeFile(join(process.cwd(),"deployments/31337.json"),JSON.stringify({schemaVersion:1,chainId:31337,deployment:{address:market.address,deploymentBlock:block.number.toString(),deploymentTxHash:tx?.hash||"",runtimeCodeHash:code?keccak256(code):"",deployedAt:new Date().toISOString(),termsVersion:"CopyrightLicenseTerms/v1"}},null,2));
console.log(`seeded ${market.address}`);
