# Copyright Ark: copyright management mechanism

[English](COPYRIGHT-MECHANISM.md) | [简体中文](COPYRIGHT-MECHANISM.zh-CN.md) · [Back to README](../README.md)

`CopyrightMarket.sol` implements the platform's registration, licensing, deposit and case-handling rules. This document explains those rules and their frontend controls. The original implementation plan records an earlier design and differs from the current version in places.

## 1. What the platform manages

The platform records a wallet's rights declaration concerning a file, and time-limited licenses issued by that wallet to buyers. Registration timestamps, fingerprints, offer terms, license states, case outcomes and accounting can be checked on-chain.

Registration does not prove authorship or automatically determine infringement. This is not an NFT, ownership transfer, online court, DRM or file-delivery system. Registrants may provide public reference links; the platform stores neither original files, covers, full evidence nor full off-chain decisions.

Business logic lives in one `CopyrightMarket` contract using OpenZeppelin ownership and reentrancy protection. A group of mutually dependent business contracts is not required.

## 2. Roles and permissions

| Role | Permitted actions | Permissions not automatically granted |
| --- | --- | --- |
| Visitor without a connected wallet | Read works, offers, licenses, historical status and public chain data | Submit signed transactions |
| Ordinary wallet | Register works, purchase others' offers, withdraw its own credits, trigger public settlement methods or fund the pool | Edit others' works or administrator lists |
| Work registrant / seller | Publish offers for their active work, cancel open offers, terminate their own active issued licenses early | Purchase their own offers or end a sold license without settlement |
| License buyer | Hold a wallet-specific license, inspect records and withdraw refunds | Transfer or sublicense that license |
| Additional administrator | Open and resolve cases, use Admin | Change the administrator list or arbitrarily withdraw user deposits |
| Owner | Administrator powers plus management of additional administrators through `setAdmins` | Bypass accounting to withdraw another user's funds |

Roles can overlap, but sellers cannot accept their own offers. Authors and buyers need no frontend whitelist. Real authorization uses transaction `msg.sender`, not displayed labels.

The default local sample owner is Hardhat account `#0`. Ordinary deployment selects `INITIAL_ADMIN_ADDRESS`, then the script configuration's first admin, then the deployer. The owner can differ from the wallet paying deployment gas. Read `owner()` on the actual hosted contract to identify its owner.

Only the owner can call `setAdmins(address[])`. It replaces the full additional-administrator list and accepts at most 50 input entries. Zero addresses are rejected, duplicates are deduplicated, and the owner does not need to appear in that list. Removing an administrator does not alter their works, licenses or existing credits. Additional administrators cannot change the list themselves.

Developer-menu inputs and default JSON are address drafts. Only a confirmed owner-signed synchronization changes on-chain permissions. Restore defaults affects the browser draft alone. On-chain permissions are shared across computers; drafts are not. Ownership uses `Ownable2Step`: transfer requires nomination and acceptance, with no frontend transfer control. The inherited renounce interface is not disabled in the current contract; renouncing loses owner-only list management and should not be confused with removing an extra administrator.

## 3. Work registration, files and deduplication

1. The browser reads a selected file and computes SHA-256. The current interface accepts nonempty PNG/JPG/JPEG/WEBP/TXT/PDF/MP3/WAV/MP4 files up to 20 MiB. This is frontend validation, not on-chain file storage.
2. `registerWork` submits a nonzero fingerprint, title, description, category and optional reference link. The contract records the registrant, timestamp and work ID.
3. Only one active registration per fingerprint is allowed. This detects identical bytes, not similar content, cropping, format conversion or plagiarism.
4. Titles are limited to 96 UTF-8 bytes; descriptions and offer scopes to 512 UTF-8 bytes. Chinese characters usually use three bytes, so these are not equivalent character counts. Reference URLs are limited on-chain to 256 bytes and may be empty or have a lowercase HTTP(S) prefix. The frontend further normalizes URLs; the contract never visits their targets.
5. Categories are image, text, audio, video and other. The registrant is responsible for the relationship between the file, declaration and reference link. The contract cannot prove that a browser file selection really happened.

Active records cannot be directly edited or deleted. Case-based invalidation releases the active fingerprint slot, allowing any wallet to register it again. The new record's `previousWorkId` links to the most recent old record. This does not prove the replacement registrant's ownership or move old licenses, credits or deposits. Historical records remain.

Reference links and metadata are public chain data: do not include private access tokens. Original files are used only for local hashing and are not uploaded to Cloudflare or another storage service.

## 4. Offers and multiple buyers

An offer sells one non-exclusive, non-transferable, non-sublicensable, time-limited use license, not copyright ownership.

Let the per-license price be `P`, fixed early-termination compensation be `C`, and quantity be `N`:

```text
Author deposit per offer D = P + C
Total batch deposit = D × N
```

For an active registration, the author sets price, compensation, duration, acceptance deadline and scope. The current frontend accepts durations of 1–365 whole days and sets acceptance to 24 hours after the latest block it reads. The acceptance deadline limits when a buyer can purchase; the license duration starts only when purchased, not when listed.

The contract itself accepts durations from 60 seconds to 365 days and acceptance deadlines at least 60 seconds and at most 30 days after execution time. Both `P` and `C` must individually be between 1 wei and 1 ETH. Direct callers need not use the frontend's whole-day durations, but must satisfy the contract limits.

`createOffers(..., quantity)` accepts 1–20 and requires exactly `D × N` in one transaction. Any validation failure reverts the whole batch; no partially successful subset survives. The original `createOffer` still creates a single offer for existing scripts.

Each offer has its own ID, terms hash, deposit and acceptance state:

- One work may have several simultaneous offers with identical or different terms.
- Several buyers may accept separate offers and hold independent non-exclusive licenses.
- One offer can be accepted only once. Competing buyers are ordered by chain execution; a later mined failed transaction may still pay gas.
- A seller cannot accept their own offer. Creating a batch does not grant a buyer N licenses or create unlimited reusable inventory.

`termsHash` binds chain ID, contract address, offer/work IDs, file fingerprint, seller, price, duration, compensation, deadline, scope and terms version. `acceptOffer` requires the matching hash and exactly `P`. Batch offers have different hashes because their IDs differ.

## 5. Cancellation, expiry and refunds before purchase

The seller can call `cancelOffer` on an open offer, moving all `D` from locked deposits to their own `claimable` balance. There is no buyer to compensate. History remains and the same deposit cannot be refunded twice.

After acceptance expiry or registration invalidation, new purchases are rejected. Any wallet may call `refundUnavailableOffer` to credit that unaccepted deposit to its original seller; the caller cannot redirect funds. Accepted offers use license settlement instead.

Display status derives from stored state, chain time and registration invalidation. Accepted, seller-cancelled, expired and invalidated are distinct outcomes. Invalidation before the acceptance deadline produces the invalidated outcome; expiry preceding invalidation remains expiry. Becoming unavailable does not itself execute a refund or transfer.

## 6. Why the seller can withdraw the price while the deposit stays locked

On acceptance, the buyer pays `P`. That transaction:

1. Marks the offer accepted and creates a buyer-specific license.
2. Records start `S = block.timestamp` and end `F = S + T`, where `T` is the duration.
3. Credits the buyer's payment `P` to the seller's claimable balance.
4. Keeps the seller's original `D = P + C` locked as refund and compensation collateral.

The buyer's price and author's collateral are different funds. The immediately claimable `P` is not a return of the author's deposit. Creating an offer without a buyer does not generate license income.

Validity is `[S, F)`: the license is already invalid at `F`, without requiring an expiry transaction. License validity and fund settlement are separate.

## 7. Three settlement outcomes after purchase

### 7.1 Author terminates early

Only the recorded seller may call `revokeLicense` while the license is active, unsettled and its registration has not been invalidated. For elapsed service time in seconds:

```text
E = floor(P × elapsed / T)
Buyer credit from deposit = P − E + C
Seller credit from deposit = E
Total = P + C = D
```

The transaction both ends the license and settles its deposit. There is no unsecured step where termination succeeds first and the author must pay later. The buyer receives the unused-price refund plus fixed compensation. A preview uses its read block; final execution may happen slightly later and change the second-based allocation.

Example: `P = 0.001 ETH`, `C = 0.0002 ETH`, and exactly half of a seven-day duration fulfilled, so `E = 0.0005 ETH`:

| Item | Amount |
| --- | --- |
| Author's original collateral payment | 0.0012 ETH |
| Buyer's price already credited to author at acceptance | 0.001 ETH |
| Deposit credited to buyer at early termination | 0.0007 ETH |
| Deposit credited to author at early termination | 0.0005 ETH |

Amounts exclude gas and first enter claimable balances. Including the original collateral payment, seller net income is `E − C`; buyer net expense is `E − C`. Compensation comes from author collateral, not newly generated platform money.

### 7.2 Normal expiry

If no earlier registration invalidation occurred and the duration ended, anyone may call `settleLicense` to credit all `D` back to the seller. The buyer received the full-term license and receives no refund.

The seller already received buyer price `P`; receiving `D` now returns their own collateral. Net income excluding gas is still `P`, not `2P + C`. Delayed settlement or withdrawal does not extend authorization.

### 7.3 Administrator invalidates registration

If registration is invalidated before license end, the license becomes invalid immediately. Anyone may separately call `settleLicense`, crediting all `D = P + C` to that buyer and zero from that deposit to the seller.

The administrator transaction updates only the work and case, without looping through all offers/licenses. Validity changes immediately, but each deposit requires a settlement transaction. Even if settlement happens after the original end date, an earlier registration invalidation still gives the full deposit to the buyer.

An already settled early-terminated license cannot be compensated twice. A license that expired before invalidation keeps normal-expiry settlement. Invalidation exactly at license end is not earlier than expiry and uses the expiry outcome. Transactions sharing a timestamp still follow execution order: seller termination settling first is final; registration invalidation first blocks subsequent author termination.

## 8. Balances, withdrawals, gas and the reward pool

`claimable[address]` is an already allocated amount that the contract owes an address. License prices, offer refunds, license settlements and case rewards are credited first; the beneficiary later calls `withdraw(recipient)` to transfer actual ETH. The interface accepts a nonzero recipient; the current frontend uses the connected wallet itself.

Locked deposits are not claimable. Claimable credits are also not wallet ETH until withdrawn and cannot directly fund new wallet transactions. Withdrawal spends only the caller's entitlement, clears accounting before transfer and uses reentrancy protection. A failed transfer reverts the accounting change.

Transaction senders pay network gas, including callers triggering public refunds/settlements. Failed estimation may prevent broadcast; rejected signatures do not charge chain gas. A mined failed transaction may consume gas while reverting business state and incoming deposits. Gas goes to the network, not the case reward pool.

The accounting relationship is:

```text
Contract ETH = locked deposits + all claimable credits + case reward pool + accidental surplus
```

`pendingCaseRewards` records uncredited reward eligibility; it is not additional ETH already held and is not added again. `getAccounting` exposes the totals. My account displays personal credits/deposits; Admin displays platform-wide totals.

The separate reward pool is **a separately accounted portion of ETH in the same contract**, not another wallet, an automatic funding account or another contract. Anyone may explicitly fund it through `fundRewardPool`. The current frontend offers a fixed 0.01 ETH funding button in Admin. Ordinary deployment does not fund it; the local sample script contributes 0.01 ETH. Plain transfers are rejected and are not a substitute for invoking the method. Forced accidental surplus is not automatically allocated to users or the pool, and has no business withdrawal interface.

## 9. Cases, administrator rewards and trust

1. An administrator collects material off-chain and calls `openCase` with a work ID, unique case reference and nonzero evidence hash. References allow 1–64 uppercase letters, digits or hyphens. Only one pending case per work is allowed at a time.
2. Pending is informational; it does not freeze trading or licenses.
3. An administrator calls `resolveCase` with uphold/invalidate, a nonzero decision hash and a summary. Any current administrator may resolve it, not necessarily the opener. The contract records the actual resolver and block time, without backdated invalidation.
4. Uphold leaves registration active. Invalidation prevents new trading and affects licenses under the preceding rules. History is retained.
5. The fixed per-case reward is deployment-time `gasSubsidy + reviewReward`: defaults 0.0001 plus 0.00005 ETH, totaling 0.00015 ETH. The gas subsidy is fixed, not reimbursement of actual gas spent.
6. Resolution records pending reward eligibility even with an empty pool. Anyone may later call `creditCaseReward(caseId)` if the pool has sufficient funds, crediting that case's recorded `resolvedBy`. A caller or replacement administrator cannot change the beneficiary.
7. Crediting succeeds only once. The beneficiary must then withdraw. An insufficient pool blocks reward crediting, without undoing the case or borrowing license deposits/refunds.

Administrators can misjudge, favor someone or submit fabricated cases. The contract does not validate evidence, provide multi-party arbitration, voting, appeals or identity checks. Administrative decision power is a trust boundary. There are no business methods for arbitrary price edits, buyer replacement, clearing user credits or withdrawing arbitrary deposits, but invalidation does affect license validity and allocation.

## 10. Status, historical lookup and pagination

Work status is active or invalidated. Offers show open, accepted, seller-cancelled, expired or invalidated. Licenses show active, author-revoked, work-invalidated or expired. The independent `settled` flag indicates whether collateral was allocated.

`isLicenseValidAt(id, at)` evaluates start/end, author-revocation and registration-invalidation timestamps, rejecting future times. A currently revoked license can still have been valid before revocation. Settlement does not rewrite past authorization.

Current `/verify` loads only a buyer's first 50 licenses and then filters by work/time; later records may exist without being displayed. Contract index methods support offset pagination, with at most 50 IDs per call. My offers and work details use compact lists with eight entries per UI page; their read implementation differs from lookup. Events and transactions provide audit records; MetaMask Activity does not necessarily include script transactions or every internal receipt.

## 11. Contract capability versus current frontend controls

| Action | Contract method | Current frontend |
| --- | --- | --- |
| Register work | `registerWork` | `/register` |
| Single/batch offers | `createOffer` / `createOffers` | `/offers` uses the batch method, allowing quantity 1 |
| Cancel an open offer | `cancelOffer` | `/offers` |
| Refund expired/invalidated unaccepted offer | `refundUnavailableOffer` | **No button yet** |
| Purchase offer | `acceptOffer` | Available offers in work details |
| Early author termination and allocation | `revokeLicense` | `/offers`, with preview |
| Settle expired/invalidated license | `settleLicense` | **No button yet** |
| Withdraw personal credits | `withdraw` | `/account` |
| Replace additional-administrator list | `setAdmins` | `/dev`, owner signature |
| Open/resolve case | `openCase` / `resolveCase` | `/admin` |
| Fund case reward pool | `fundRewardPool` | `/admin`, currently fixed 0.01 ETH |
| Credit case reward to claimable balance | `creditCaseReward` | **No button yet** |

Operations without controls require scripts or contract tools using the correct network, deployed address and offer/license/case ID, with gas paid by the caller. Refreshing the browser or waiting does not execute them. The README focuses on available frontend controls and does not claim these buttons exist.

## 12. Local, Sepolia and deployment boundaries

A locally accessed frontend permits Hardhat/Sepolia switching; remotely hosted frontends permit Sepolia only. Network selection changes reads and transaction targets, not permissions or data ownership. Cloudflare does not maintain local node state.

`seed:local` signs with node-controlled unlocked accounts, creating real local-chain transactions. It does not use MetaMask, impersonate accounts, edit storage directly or advance time. Restarting Hardhat loses in-memory state; recreate samples and export again. Repeated test keys reproduce addresses, not chain state.

There is no upgradeable proxy. New contract versions deploy at new addresses; old funds and records remain at their original addresses. Frontend and Cloudflare public-address configuration selects an instance; it does not migrate funds or copy administrator permissions.

## 13. Source and related documents

- [CopyrightMarket contract](../contracts/contracts/CopyrightMarket.sol)
- [Deployment script](../contracts/scripts/deploy.ts) / [local sample script](../contracts/scripts/seed-local.ts)
- [Standard license terms v1](LICENSE-TERMS-V1.en.md) / [Chinese terms](LICENSE-TERMS-V1.md)
- [Local sample IDs and accounting (Chinese)](LOCAL-SAMPLES.md)
- [Original implementation plan (historical design, Chinese)](Copyright-DApp-V1-实施规划书.md)
