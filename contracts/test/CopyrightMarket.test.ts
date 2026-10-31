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
});
