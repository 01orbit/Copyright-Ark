import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("CopyrightMarket", async () => {
  const { viem } = await network.connect();
  const clients = await viem.getWalletClients();
  const [admin, seller, buyer, other] = clients;
  const market = await viem.deployContract("CopyrightMarket", [admin.account.address, 100000000000000n, 50000000000000n]);
  const hash = `0x${"12".repeat(32)}` as `0x${string}`;
  it("lets the owner manage multiple on-chain administrators", async () => {
    const managedMarket = await viem.deployContract("CopyrightMarket", [admin.account.address, 0n, 0n]);
    assert.equal(await managedMarket.read.isAdmin([admin.account.address]), true);
    assert.equal(await managedMarket.read.isAdmin([buyer.account.address]), false);
    await assert.rejects(() => managedMarket.write.setAdmins([[buyer.account.address]], { account: buyer.account }));
    await managedMarket.write.setAdmins([[buyer.account.address, other.account.address]], { account: admin.account });
    assert.deepEqual(
      (await managedMarket.read.getAdmins()).map((address) => address.toLowerCase()),
      [buyer.account.address, other.account.address].map((address) => address.toLowerCase()),
    );
    assert.equal(await managedMarket.read.isAdmin([buyer.account.address]), true);
    await managedMarket.write.registerWork([`0x${"aa".repeat(32)}`, "Admin Work", "", 1, ""], { account: other.account });
    await managedMarket.write.openCase([1n, "CASE-ADMIN-1", `0x${"bb".repeat(32)}`], { account: buyer.account });
    await managedMarket.write.setAdmins([[other.account.address]], { account: admin.account });
    assert.equal(await managedMarket.read.isAdmin([buyer.account.address]), false);
    assert.equal(await managedMarket.read.isAdmin([admin.account.address]), true);
    await assert.rejects(() => managedMarket.write.openCase([1n, "CASE-ADMIN-2", `0x${"cc".repeat(32)}`], { account: buyer.account }));
  });
  it("registers, prevents duplicate active hash and creates a deposit-backed offer", async () => {
    await market.write.registerWork([hash,"Test Work","Description",1,"https://example.com/work"],{account:seller.account});
    const work = await market.read.getWork([1n]);
    assert.equal(work.referenceUrl, "https://example.com/work");
    await assert.rejects(() => market.write.registerWork([hash,"Another","",1,""] ,{account:buyer.account}));
    await assert.rejects(() => market.write.registerWork([`0x${"13".repeat(32)}` as `0x${string}`,"Long URL","",1,"x".repeat(257)],{account:buyer.account}));
    await assert.rejects(() => market.write.registerWork([`0x${"14".repeat(32)}` as `0x${string}`,"Unsafe URL","",1,"javascript:alert(1)"],{account:buyer.account}));
    const now = BigInt(Math.floor(Date.now()/1000));
    await market.write.createOffer([1,parseEther("0.001"),3600n,parseEther("0.0002"),now+3600n,"research"],{account:seller.account,value:parseEther("0.0012")});
    assert.equal(await market.read.totalLockedDeposits(),parseEther("0.0012"));
    const offer=await market.read.getOffer([1]); assert.equal(offer.seller.toLowerCase(),seller.account.address.toLowerCase());
  });
  it("accepts and credits price, then author revoke splits the locked deposit", async () => {
    const offer=await market.read.getOffer([1]);
    await market.write.acceptOffer([1,offer.termsHash],{account:buyer.account,value:parseEther("0.001")});
    assert.equal(await market.read.claimable([seller.account.address]),parseEther("0.001"));
    await market.write.revokeLicense([1],{account:seller.account});
    const buyerCredit=await market.read.claimable([buyer.account.address]);
    assert.ok(buyerCredit >= parseEther("0.0002"));
    assert.equal(await market.read.totalLockedDeposits(),0n);
    await market.write.withdraw([buyer.account.address],{account:buyer.account});
  });
  it("keeps case reward separate from license funds", async () => {
    const hash2=`0x${"34".repeat(32)}` as `0x${string}`;
    await market.write.registerWork([hash2,"Case Work","",2,""],{account:other.account});
    await market.write.openCase([2,"CASE-2026-0001",`0x${"56".repeat(32)}` as `0x${string}`],{account:admin.account});
    await market.write.resolveCase([1,2,`0x${"78".repeat(32)}` as `0x${string}`,"违规登记"],{account:admin.account});
    assert.equal(await market.read.pendingCaseRewards(),150000000000000n);
    await assert.rejects(() => market.write.creditCaseReward([1],{account:other.account}));
    await market.write.fundRewardPool({account:admin.account,value:150000000000000n});
    await market.write.creditCaseReward([1],{account:other.account});
    assert.equal(await market.read.claimable([admin.account.address]),150000000000000n);
  });
  it("lets the seller cancel an open offer and credits its full deposit", async () => {
    const now = BigInt(Math.floor(Date.now()/1000));
    const before = await market.read.claimable([seller.account.address]);
    await market.write.createOffer([1,parseEther("0.002"),3600n,parseEther("0.0003"),now+3600n,"research"],{account:seller.account,value:parseEther("0.0023")});
    await market.write.cancelOffer([2],{account:seller.account});
    assert.equal(await market.read.getOfferStatus([2]),3);
    assert.equal(await market.read.claimable([seller.account.address]),before+parseEther("0.0023"));
    assert.equal(await market.read.totalLockedDeposits(),0n);
  });
  it("keeps an offer deposit locked until cancellation and credits it only once", async () => {
    const escrowMarket = await viem.deployContract("CopyrightMarket", [admin.account.address, 100000000000000n, 50000000000000n]);
    const escrowHash = `0x${"ab".repeat(32)}` as `0x${string}`;
    await escrowMarket.write.registerWork([escrowHash,"Escrow Test","",1,""],{account:seller.account});
    const now = BigInt(Math.floor(Date.now()/1000));
    const price = parseEther("0.001");
    const compensation = parseEther("0.0002");
    const deposit = price + compensation;

    await escrowMarket.write.createOffer([1,price,3600n,compensation,now+3600n,"research"],{account:seller.account,value:deposit});
    assert.equal(await escrowMarket.read.claimable([seller.account.address]),0n);
    assert.deepEqual(await escrowMarket.read.getAccounting(),[deposit,deposit,0n,0n,0n,0n]);
    await assert.rejects(() => escrowMarket.write.withdraw([seller.account.address],{account:seller.account}));

    await escrowMarket.write.cancelOffer([1],{account:seller.account});
    assert.equal(await escrowMarket.read.claimable([seller.account.address]),deposit);
    assert.deepEqual(await escrowMarket.read.getAccounting(),[deposit,0n,deposit,0n,0n,0n]);
    await escrowMarket.write.withdraw([seller.account.address],{account:seller.account});
    assert.equal(await escrowMarket.read.claimable([seller.account.address]),0n);
    assert.deepEqual(await escrowMarket.read.getAccounting(),[0n,0n,0n,0n,0n,0n]);
    await assert.rejects(() => escrowMarket.write.withdraw([seller.account.address],{account:seller.account}));
    await assert.rejects(() => escrowMarket.write.cancelOffer([1],{account:seller.account}));
  });
  it("licenses one work to multiple buyers through separate offers and prevents double acceptance", async () => {
    const multiMarket = await viem.deployContract("CopyrightMarket", [admin.account.address, 0n, 0n]);
    await multiMarket.write.registerWork([`0x${"cd".repeat(32)}`, "Shared Work", "", 1, ""], { account: seller.account });
    const publicClient = await viem.getPublicClient();
    const deadline = (await publicClient.getBlock()).timestamp + 86400n;
    const price = parseEther("0.001");
    const deposit = parseEther("0.0012");
    for (let index = 0; index < 2; index++) {
      await multiMarket.write.createOffer([1n, price, 86400n, deposit - price, deadline, "non-exclusive"], { account: seller.account, value: deposit });
    }
    const first = await multiMarket.read.getOffer([1n]);
    await multiMarket.write.acceptOffer([1n, first.termsHash], { account: buyer.account, value: price });
    const otherBalance = await publicClient.getBalance({ address: other.account.address });
    await assert.rejects(() => multiMarket.write.acceptOffer([1n, first.termsHash], { account: other.account, value: price }));
    assert.equal(await publicClient.getBalance({ address: other.account.address }), otherBalance);
    const second = await multiMarket.read.getOffer([2n]);
    await multiMarket.write.acceptOffer([2n, second.termsHash], { account: other.account, value: price });
    assert.equal((await multiMarket.read.getLicense([1n])).licensee.toLowerCase(), buyer.account.address.toLowerCase());
    assert.equal((await multiMarket.read.getLicense([2n])).licensee.toLowerCase(), other.account.address.toLowerCase());
    assert.equal((await multiMarket.read.getWork([1n])).acceptedCount, 2n);
    assert.equal(await multiMarket.read.totalLockedDeposits(), deposit * 2n);
    await multiMarket.write.revokeLicense([1n], { account: seller.account });
    assert.equal(await multiMarket.read.getLicenseStatus([1n]), 2);
    assert.equal(await multiMarket.read.getLicenseStatus([2n]), 1);
    assert.equal(await multiMarket.read.totalLockedDeposits(), deposit);
  });
});
