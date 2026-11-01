# Copyright Ark

[English](README.md) | [简体中文](README.zh-CN.md)

A small copyright management DApp for an undergraduate Web3 course. Register file fingerprints, publish non-exclusive license offers, purchase licenses, and manage deposits and copyright cases. The interface defaults to English and supports Chinese.

Registration records a rights declaration, not proof of legal ownership. This project is for Hardhat local testing and Ethereum Sepolia, not production use.

## Features and structure

- SHA-256 hashing in the browser; original files are never uploaded. Optional public HTTP(S) reference links are stored on-chain.
- Create **1–20 identical offers with one transaction and one wallet confirmation**. Each offer can be purchased or cancelled independently.
- Author deposit: `(price + fixed compensation) × quantity`. Buyers pay the license price separately. Early revocation refunds the unused price plus compensation from the deposit.
- Filtered, paginated offers and licenses; historical license checks; claimable balances and withdrawals.
- Owner-authorized administrators and copyright cases, with a separately funded case reward pool.

| Directory | Contents |
| --- | --- |
| `contracts/` | Solidity, Hardhat 3, deployment scripts, local samples and tests |
| `frontend/` | React, TypeScript, Vite, Tailwind CSS 4, HeroUI 3 and Wagmi/Viem |
| `docs/` | Requirements, license terms and detailed deployment/testing guides |

Business data lives in `CopyrightMarket`. There is no application backend, database, file storage or R2 dependency. MetaMask signs frontend transactions.

## Local version

Use Node.js **24.15.0** (`.nvmrc`), npm and MetaMask. Run all commands from the repository root.

```bash
npm ci --prefix contracts
npm ci --prefix frontend
```

**Terminal 1:** start the blockchain and keep it running.

```bash
npm run node --prefix contracts
```

**Terminal 2:** compile, deploy samples and export the frontend interface.

```bash
npm run build --prefix contracts
npm run seed:local --prefix contracts
npm run export-interface --prefix contracts
```

Samples include 30 works, 58 offers, 24 licenses and 3 cases, with English metadata. The script does not advance time. For an empty deployment, replace `seed:local` with `deploy:local`.

Create or edit `frontend/.env` using its example as a template:

```dotenv
VITE_DEFAULT_CHAIN_ID=31337
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
VITE_LOCAL_MARKET_ADDRESS=
VITE_SEPOLIA_MARKET_ADDRESS=
```

Blank addresses use `frontend/src/generated/deployments.json`; remove stale address overrides after redeploying. Then start Vite:

```bash
npm run dev --prefix frontend
```

Open the URL printed by Vite. In MetaMask, add RPC `http://127.0.0.1:8545`, chain ID `31337`, currency `ETH`, and import Hardhat test accounts. These publicly known private keys must never be used on public networks. The developer menu allows switching the local frontend between Hardhat and Sepolia.

Stop servers with `Ctrl+C` in their terminals. Stopping Hardhat loses its in-memory chain state; restart it, rerun the sample/export commands, and refresh the frontend.

## Cloudflare / Sepolia version

Cloudflare hosts static files, not Hardhat. Hosted websites, including custom domains, use **Sepolia only**.

1. Create `contracts/.env` from its example. Set `DEPLOYER_PRIVATE_KEY` to a dedicated Sepolia test wallet key and fund that wallet with test ETH. Set `INITIAL_ADMIN_ADDRESS` to the intended owner's public address. PublicNode RPC is the default; `ETHERSCAN_API_KEY` is optional and unnecessary for deployment.
2. Deploy and export:

   ```bash
   npm run build --prefix contracts
   npm test --prefix contracts
   npm run deploy:sepolia --prefix contracts
   npm run export:sepolia --prefix contracts
   npm run smoke:sepolia --prefix contracts
   ```

3. Commit source changes, `contracts/deployments/11155111.json` and `frontend/src/generated/`. Never commit `.env`, private keys or recovery phrases.
4. Connect the repository to Cloudflare with these settings:

   | Setting | Workers | Pages |
   | --- | --- | --- |
   | Root directory | Repository root | Repository root |
   | Build command | `npm ci --prefix frontend && npm run build --prefix frontend` | Same |
   | Deploy command | `npx wrangler deploy` | Not required |
   | Static output | Set by `wrangler.jsonc`: `frontend/dist` | `frontend/dist` |

5. Set **build environment variables**: `NODE_VERSION=24.15.0`, `VITE_DEFAULT_CHAIN_ID=11155111`, `VITE_SEPOLIA_MARKET_ADDRESS=<new Sepolia address>`, and optionally `VITE_SEPOLIA_RPC_URL`. Trigger a fresh build; runtime-only variables cannot change the built Vite app. Do not put private keys in Cloudflare or `VITE_*` variables.
6. Open the deployment URL with MetaMask on Sepolia (`11155111`). Register a work, create three offers with one confirmation, then accept an offer with another wallet. Check revocation, deposits and withdrawals. Extra administrators require an owner-signed synchronization in `/dev`.

**Existing deployments:** this version adds `createOffers`, which older contracts do not support. Redeploy, export, update Cloudflare's contract address and rebuild. Environment address overrides take priority over exported records. The new contract starts empty; old works, balances and permissions stay at the old address. Save that address and handle old funds before switching. Reauthorize extra administrators on the new contract. Local samples are never automatically created on Sepolia.

## Checks and guides

```bash
npm test --prefix contracts
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

Current suite: 10 contract tests and 26 frontend tests. Real MetaMask confirmations and Sepolia transactions still require manual testing.

- [Detailed Cloudflare deployment and testing guide (Chinese)](docs/DEPLOY-CLOUDFLARE.md)
- [Local sample accounts and scenarios (Chinese)](docs/LOCAL-SAMPLES.md)
- [Cloudflare Workers build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
