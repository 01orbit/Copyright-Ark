import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { network } from "hardhat";
import { formatEther, keccak256, parseEther, sha256, toHex, type Hash } from "viem";
import { loadTestAccounts, type TestRole } from "./test-accounts.js";
import sampleWorks from "./sample-works.json" with { type: "json" };

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
if (await publicClient.getChainId() !== 31337) throw new Error("示例脚本只允许在本地链 31337 运行。");
const reportPath = join(process.cwd(), "deployments/31337.samples.json");
let previous: { address: `0x${string}` } | undefined;
try {
  previous = JSON.parse(await readFile(reportPath, "utf8"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
// 不在同一节点上静默重复部署、替换用户正在测试的样例合约。
if (previous && await publicClient.getBytecode({ address: previous.address })) {
  throw new Error("本地链已有示例。请继续测试；需要重新生成时，先停止并重启 Hardhat 节点。");
}

const clients = await viem.getWalletClients();
const configured = (await loadTestAccounts())["31337"];
if (!configured) throw new Error("contracts/test-accounts.json 缺少 31337 配置。");
function clientFor(role: TestRole, fallbackIndex: number) {
  return configured[role]
    .map((address) => clients.find((client) => client.account.address.toLowerCase() === address.toLowerCase()))
    .find(Boolean) ?? clients[fallbackIndex];
}
const admin = clientFor("admin", 0);
const seller = clientFor("author", 1);
const buyer = clientFor("buyer", 2);
if (!admin || !seller || !buyer) throw new Error("本地链没有足够的测试钱包。");
const used = new Set([admin, seller, buyer].map((client) => client.account.address.toLowerCase()));
if (used.size !== 3) throw new Error("管理员、作者、买家必须是三个不同的本地测试账户。");
const [secondSeller, secondBuyer] = clients.filter((client) => !used.has(client.account.address.toLowerCase()));
if (!secondSeller || !secondBuyer) throw new Error("示例需要至少五个本地测试账户。");
const actors = { admin, seller, buyer, secondSeller, secondBuyer };
const wallets = await Promise.all(Object.entries(actors).map(async ([role, client]) => ({
  role, address: client.account.address,
  before: await publicClient.getBalance({ address: client.account.address }),
  sent: 0n, received: 0n, gas: 0n,
})));
const transactions: { label: string; hash: Hash }[] = [];
async function confirm(hash: Hash, label: string) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, "success", label);
  const tx = await publicClient.getTransaction({ hash });
  const wallet = wallets.find((item) => item.address.toLowerCase() === tx.from.toLowerCase());
  assert.ok(wallet, "每笔交易都应由所选测试账户发送");
  wallet.sent += tx.value;
  wallet.gas += receipt.gasUsed * receipt.effectiveGasPrice;
  transactions.push({ label, hash });
  return receipt;
}

const { contract: market, deploymentTransaction } = await viem.sendDeploymentTransaction(
  "CopyrightMarket",
  [admin.account.address, parseEther("0.0001"), parseEther("0.00005")],
  { client: { wallet: admin } },
);
const deploymentReceipt = await confirm(deploymentTransaction.hash, "Deploy sample contract");
await mkdir(join(process.cwd(), "deployments"), { recursive: true });
// 中途失败也保留标记，提醒重启节点后再生成完整数据。
await writeFile(reportPath, JSON.stringify({ address: market.address, complete: false }, null, 2));
await confirm(await market.write.fundRewardPool({ account: admin.account, value: parseEther("0.01") }), "Fund case reward pool");

const licenseScopes = [
  "",
  "Non-exclusive use in educational presentations and non-commercial websites. Credit the photographer. No resale or redistribution of the original image.",
  "Non-exclusive use of excerpts of up to 500 words in teaching materials and non-commercial articles. Credit the author. No publication of the full text.",
  "Non-exclusive synchronization in one non-commercial student film or podcast episode. Credit the composer. No standalone audio redistribution.",
  "Non-exclusive screening at campus events and in classroom presentations. Credit the filmmaker. No editing or re-uploading the complete film.",
  "Non-exclusive use in one student design prototype. Credit the designer. No resale of source assets or registration of the design as a trademark.",
];
const works = [];
for (const [index, { title, description, category }] of sampleWorks.entries()) {
  const author = index < 24 ? seller : secondSeller;
  const id = await market.read.nextWorkId();
  const referenceUrl = index % 3 === 0 ? "" : `https://example.com/works/${title.toLowerCase().replaceAll(" ", "-")}`;
  await confirm(await market.write.registerWork([
    sha256(toHex(`${title}\n${description}`)), title, description, category, referenceUrl,
  ], { account: author.account }), `Register work #${id}: ${title}`);
  works.push({ id, title, description, category, referenceUrl, author: author.account.address });
}

const price = parseEther("0.001");
const compensation = parseEther("0.0002");
const day = 86400n;
type Client = typeof seller;
type Sample = { id: bigint; workId: bigint; scenario: string; licenseId: bigint; buyer?: string };
const samples: Sample[] = [];
async function offer(workId: bigint, scenario: string, author: Client = seller, duration = 7n * day, offerPrice = price) {
  const id = await market.read.nextOfferId();
  const now = (await publicClient.getBlock()).timestamp;
  await confirm(await market.write.createOffer([
    workId, offerPrice, duration, compensation,
    now + (scenario === "Short-window offer" ? 3600n : 7n * day),
    licenseScopes[works[Number(workId) - 1].category],
  ], { account: author.account, value: offerPrice + compensation }), `Publish offer #${id}`);
  const sample: Sample = { id, workId, scenario, licenseId: 0n };
  samples.push(sample);
  return sample;
}
async function accept(sample: Sample) {
  const record = await market.read.getOffer([sample.id]);
  const client = (await market.read.nextLicenseId()) % 5n === 0n ? secondBuyer : buyer;
  await confirm(await market.write.acceptOffer([sample.id, record.termsHash], {
    account: client.account, value: record.price,
  }), `Accept offer #${sample.id}`);
  sample.licenseId = (await market.read.getOffer([sample.id])).licenseId;
  sample.buyer = client.account.address;
}

console.log("正在生成历史挂单、许可与案件…");
for (let index = 0; index < 4; index++) await offer(BigInt(index + 1), "Short-window offer");
for (let index = 0; index < 6; index++) await accept(await offer(BigInt(index + 1), "Short-term license", seller, 3600n));
for (let index = 0; index < 4; index++) {
  const sample = await offer(BigInt(index + 7), "Author-revoked license");
  await accept(sample);
  await confirm(await market.write.revokeLicense([sample.licenseId], { account: seller.account }), `Revoke license #${sample.licenseId}`);
}
for (let index = 0; index < 4; index++) await offer(21n, "Invalidated-work offer");
for (let index = 0; index < 4; index++) await accept(await offer(21n, "Invalidated-work license"));

async function openCase(workId: bigint, reference: string) {
  const id = await market.read.nextCaseId();
  await confirm(await market.write.openCase([
    workId, reference, sha256(toHex(`${reference} evidence`)),
  ], { account: admin.account }), `Open case #${id}`);
  return id;
}
async function resolveCase(id: bigint, invalidate: boolean) {
  await confirm(await market.write.resolveCase([
    id, invalidate ? 2 : 1, sha256(toHex(`decision ${id}`)),
    invalidate
      ? "Registration of Blue Hour Station revoked after the review found an earlier photographer's publication and no permission from the original rights holder."
      : "Registration of Paper Boats upheld after the composer supplied dated notation drafts and original rehearsal recordings.",
  ], { account: admin.account }), `Resolve case #${id}`);
}
await resolveCase(await openCase(21n, "PHOTO-PRIOR-PUBLICATION"), true);
await confirm(await market.write.creditCaseReward([1n], { account: buyer.account }), "Credit case #1 reward to administrator");
await openCase(22n, "ESSAY-ATTRIBUTION-REVIEW");
await resolveCase(await openCase(23n, "MUSIC-AUTHORSHIP-CONFIRMED"), false);
for (const sample of samples.filter((item) => item.scenario === "Invalidated-work offer").slice(0, 2)) {
  await confirm(await market.write.refundUnavailableOffer([sample.id], { account: buyer.account }), `Refund invalidated-work offer #${sample.id}`);
}
for (const sample of samples.filter((item) => item.scenario === "Invalidated-work license").slice(0, 2)) {
  await confirm(await market.write.settleLicense([sample.licenseId], { account: buyer.account }), `Settle invalidated-work license #${sample.licenseId}`);
}

// 到期场景按真实时间等待，不修改本地链时间，也不提前退款或结算。
const withdrawn = await market.read.claimable([seller.account.address]);
await confirm(await market.write.withdraw([seller.account.address], { account: seller.account }), "Withdraw author's historical balance");
wallets.find((wallet) => wallet.address === seller.account.address)!.received += withdrawn;
assert.equal(await market.read.claimable([seller.account.address]), 0n);

console.log("正在生成可继续手动操作的挂单与许可…");
for (let index = 0; index < 10; index++) await accept(await offer(BigInt(index + 1), "Active license"));
for (let index = 0; index < 6; index++) {
  const sample = await offer(BigInt(index + 11), "Seller-cancelled offer");
  await confirm(await market.write.cancelOffer([sample.id], { account: seller.account }), `Cancel offer #${sample.id}`);
}
for (let index = 0; index < 10; index++) await offer(BigInt(index + 1), "Available offer");
for (let index = 0; index < 4; index++) await offer(BigInt(index + 25), "Second author's offer", secondSeller);

// 同一作品同时提供三笔非独占授权，买家可以选择价格和期限。
for (const workId of [1n, 25n, 26n]) {
  const author = workId === 1n ? seller : secondSeller;
  await offer(workId, "Available short-term offer", author, 3n * day, parseEther("0.0005"));
  await offer(workId, "Available long-term offer", author, 30n * day, parseEther("0.002"));
}

// 验证真实交易和余额；不使用 setBalance 或 impersonateAccount 伪造资金/权限。
let expectedLocked = 0n;
const offerStatuses: Record<string, number> = {};
const licenseStatuses: Record<string, number> = {};
const records = [];
for (const sample of samples) {
  const record = await market.read.getOffer([sample.id]);
  const status = await market.read.getOfferStatus([sample.id]);
  offerStatuses[status] = (offerStatuses[status] ?? 0) + 1;
  const license = sample.licenseId ? await market.read.getLicense([sample.licenseId]) : undefined;
  const licenseStatus = license ? await market.read.getLicenseStatus([license.id]) : undefined;
  if (licenseStatus !== undefined) licenseStatuses[licenseStatus] = (licenseStatuses[licenseStatus] ?? 0) + 1;
  if (record.state === 1 || (record.state === 2 && license && !license.settled)) expectedLocked += record.price + record.compensation;
  records.push({ ...sample, price: record.price, duration: record.duration, compensation: record.compensation, status, licenseStatus, settled: license?.settled });
}
assert.deepEqual(offerStatuses, { 1: 24, 2: 24, 3: 6, 5: 4 });
for (const workId of [1n, 25n, 26n]) {
  const available = records.filter((record) => record.workId === workId && record.status === 1 && record.scenario !== "Short-window offer");
  assert.equal(available.length, 3, `Work #${workId} must have three available offers`);
  assert.equal(new Set(available.map((record) => record.price)).size, 3);
  assert.equal(new Set(available.map((record) => record.duration)).size, 3);
}
assert.deepEqual(licenseStatuses, { 1: 16, 2: 4, 3: 4 });
const accounting = await market.read.getAccounting();
assert.equal(accounting[1], expectedLocked);
const totalCredits = (await Promise.all(wallets.map((wallet) => market.read.claimable([wallet.address])))).reduce((total, amount) => total + amount, 0n);
assert.equal(accounting[2], totalCredits);
assert.equal(accounting[0], accounting[1] + accounting[2] + accounting[3]);
assert.equal(accounting[4], parseEther("0.00015"));
assert.equal(accounting[5], 0n);
const balances = [];
for (const wallet of wallets) {
  const after = await publicClient.getBalance({ address: wallet.address });
  assert.equal(after, wallet.before - wallet.sent + wallet.received - wallet.gas, wallet.role);
  balances.push({ ...wallet, after, claimable: await market.read.claimable([wallet.address]) });
}
const code = await publicClient.getBytecode({ address: market.address });
const deployment = {
  address: market.address, deploymentBlock: deploymentReceipt.blockNumber.toString(),
  deploymentTxHash: deploymentReceipt.transactionHash, runtimeCodeHash: keccak256(code!),
  deployedAt: new Date().toISOString(), termsVersion: "CopyrightLicenseTerms/v1",
};
const json = (value: unknown) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);
await writeFile(join(process.cwd(), "deployments/31337.json"), json({ schemaVersion: 1, chainId: 31337, deployment }));
await writeFile(reportPath, json({
  schemaVersion: 1, complete: true, address: market.address, advancedSeconds: 0,
  works, offers: records, offerStatuses, licenseStatuses, accounting, balances, transactions,
}));
console.log(`\n合约：${market.address}`);
console.log("作品 30 件；挂单 58 笔（主要作者 50）；许可 24 份；案件 3 件。");
console.log("作品 #1、#25、#26 各有三种常规可接单挂单：3 天 / 0.0005 ETH、7 天 / 0.001 ETH、30 天 / 0.002 ETH。");
console.log(`全部 ${transactions.length} 笔交易成功，账户余额和合约账本核验通过。`);
for (const wallet of balances) {
  console.log(`${wallet.role}: ${wallet.address} | 钱包 ${formatEther(wallet.after)} ETH | 可领取 ${formatEther(wallet.claimable)} ETH`);
}
console.log("未修改本地链时间；短期挂单和许可将在真实一小时后到期。编号、状态、金额和交易哈希见 deployments/31337.samples.json。");
console.log("接着运行 npm run export-interface --prefix contracts（项目根目录），再启动或刷新前端。");
