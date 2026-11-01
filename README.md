# Copyright Ark

[English](README.md) | [简体中文](README.zh-CN.md)

Copyright Ark is a decentralized copyright management platform for registering file fingerprints, offering non-exclusive licenses and purchasing usage rights. Author deposits cover refunds and compensation when a license ends early. The interface supports English and Chinese, with English as the default.

Frontend: React, TypeScript, Vite, Tailwind CSS 4, HeroUI 3 and Wagmi/Viem. Contracts: Solidity 0.8.28, Hardhat 3 and OpenZeppelin. Source lives in `frontend/` and `contracts/`; guides and specifications live in `docs/`. No database or object-storage subscription is required.

Jump to: [Hosted use](#1-using-the-hosted-site) · [Cloudflare deployment](#2-deploying-to-cloudflare) · [Local setup](#3-running-locally) · [Troubleshooting](#4-test-commands-and-troubleshooting) · [Mechanism](#5-copyright-mechanism-and-further-reading).

**Choose how you want to use it:**

| Mode | Available networks | What must run | Where business data lives |
| --- | --- | --- | --- |
| Visit the hosted website | Sepolia only (`11155111`) | The visitor needs a browser and MetaMask | The selected Sepolia contract |
| Download and run locally | Hardhat (`31337`), with an option to switch to Sepolia | Keep two terminals running for local-chain testing | Local node memory, or the selected Sepolia contract |

Cloudflare hosts static frontend files; it does not run this project's Hardhat node. Both modes use the same frontend code, with network availability restricted by the hosting environment. Different networks and different contract addresses have separate data.

## 1. Using the hosted site

### Step 1 — Prepare wallets

Website: [Copyright Ark](https://copyright-ark.zsong2308.workers.dev/). The developer menu shows the deployed contract's owner and authorized administrators.

To use an already deployed website, **you do not need the repository, Node.js, terminal commands, or a local blockchain**.

1. Install and set up MetaMask in your browser.
2. Prepare three dedicated test accounts: administrator, author and buyer. They can be accounts in the same MetaMask installation. Every account submitting transactions needs Sepolia test ETH.
3. Show test networks in MetaMask and select **Sepolia**, chain ID `11155111`. This project does not use mainnet ETH.
4. Obtain test ETH for the author and buyer. Administrators also pay gas for case actions and permission updates. Authors additionally fund deposits; buyers pay license prices. Gas varies, so there is no fixed minimum balance.

Any wallet you control can act as author or buyer without being listed in a configuration file. Creating three accounts does not make one an administrator: only the on-chain owner and addresses authorized by that owner have administrator permissions. Visitors need the current owner's authorization to test administrative actions.

### Step 2 — Confirm the network and deployment

1. Open the landing page and enter **Discover**.
2. Connect MetaMask using the top wallet button. Connecting does not transfer ETH.
3. Open **Developer** (`/dev`) to inspect the owner, additional administrators and selected network. Hosted sites show Sepolia only, without a local-chain switch.
4. To confirm the actual contract address, consult the maintainer's deployment record or Cloudflare build configuration. A wallet address is not a contract address.
5. If MetaMask is on another network, switch it to Sepolia as prompted. Language preferences and locally saved address drafts do not grant on-chain permissions.

### Step 3 — Test the main workflow in order

| Step | Account and page | Action and expected result |
| --- | --- | --- |
| 1 | Author, **Register** | Select a file and check that its name and fingerprint appear. Enter a title, description, category and optional public HTTP(S) reference link. Accept the declaration and submit. After wallet confirmation and mining, the work appears in Discover. |
| 2 | Author, **Discover** | Open a reference link directly from its list entry or work details. The original file is not uploaded; the site stores neither original works nor cover images. |
| 3 | Author, **My offers** | Create offers from My registered works. Try price `0.001 ETH`, compensation `0.0002 ETH`, duration 7 days and quantity 3. The total deposit is `0.0036 ETH`, plus gas, with only one transaction confirmation. |
| 4 | Author, **My offers** | Cancel one unaccepted offer. It remains in history as cancelled, and its `0.0012 ETH` deposit becomes claimable; it is not immediately transferred back to the wallet. |
| 5 | Buyer, work details | Switch to a different wallet, review and accept an available offer, agree to its terms, and pay `0.001 ETH` plus gas. A separate license is issued. Authors cannot accept their own offers. |
| 6 | Author, **My offers** | Preview early termination of the issued license. Confirming immediately ends it and allocates the unused price refund plus fixed compensation from the already locked deposit, without requesting a new author payment. |
| 7 | Any visitor, **License lookup** | Enter the buyer address, optionally a work ID and historical time, and inspect valid or ended records. Reads require neither wallet connection nor gas; future times are rejected. |
| 8 | Author and buyer, **My account** | Inspect locked deposits and claimable balances separately. Withdraw the full claimable balance: the wallet receives that amount, pays transaction gas, and the claimable balance becomes zero. |
| 9 | Administrator, **Admin** | Open a case with a case reference, work ID and evidence hash, then submit an uphold or invalidate decision. This records an off-chain decision; it does not automatically establish ownership. |

A batch succeeds or fails as a whole. Rejecting the wallet request creates no offers. After a receipt timeout, use **Check transaction status** to wait for the same transaction. Closing the page does not cancel a submitted transaction; inspect the wallet or explorer before creating another batch.

Several buyers can license the same work through separate non-exclusive offers. One offer can be accepted only once: if two buyers compete for it, the first successful transaction wins; a mined failed transaction may still consume gas. Create 10 offers to test filters and pagination; available offers show eight entries per page.

### Step 4 — Authorize additional administrators

1. Connect the current contract **owner** and open `/dev`.
2. Inspect the existing on-chain administrator list. Enter all additional administrators you want to retain or add, one public address per line.
3. Click **Sync on-chain administrators** and confirm the transaction in the owner's MetaMask.
4. After confirmation, the new administrator can connect their own wallet and use Admin. All visitors read the updated permissions from the contract.

Synchronization **replaces the entire additional-administrator list**, rather than appending just the entered addresses. Omitted addresses lose their extra permissions; the owner retains administrator access. Restore defaults only resets the local browser draft. Extra administrators can handle cases but cannot independently change the administrator list; that remains owner-only.

### Step 5 — Understand current interface boundaries

The frontend supports registration, batch offers, cancellation of open offers, purchases, author early termination, lookup, withdrawals, case creation/decisions, administrator synchronization and reward-pool funding. It **does not yet expose buttons** for refunding expired/invalidated offers, settling expired/invalidated licenses, or crediting case rewards. The contract implements those operations, but scripts or contract tools must call them separately. An expired status does not mean that funds were automatically returned to a wallet. See the mechanism documentation linked at the end.

## 2. Deploying to Cloudflare

Skip this section when using an existing website. Run every command below from the repository root. `--prefix contracts` and `--prefix frontend` select the relevant npm project without repeatedly changing directories.

### Step 1 — Get the repository and Node.js

Copy your repository URL from GitHub's **Code** menu and replace `YOUR_REPOSITORY_URL` below. If the repository already exists locally, enter that directory instead of cloning again.

```bash
git clone YOUR_REPOSITORY_URL copyright-dapp
cd copyright-dapp
```

The first command downloads source into `copyright-dapp`; the second enters its root. The repository URL is a placeholder and must be replaced.

If you use nvm:

```bash
nvm install
nvm use
node --version
```

`nvm install` installs Node.js `24.15.0` from `.nvmrc`; `nvm use` selects it for this terminal; `node --version` checks the result. Alternatively, install that Node.js version directly and skip the nvm commands.

```bash
npm ci --prefix contracts
npm ci --prefix frontend
```

These install the contract and frontend dependencies using their respective lockfiles. `npm ci` replaces the selected `node_modules` without changing dependency versions; it does not deploy anything.

### Step 2 — Configure the deployment wallet

Only if `contracts/.env` does not already exist:

```bash
cp contracts/.env.example contracts/.env
```

This copies the template. **Edit an existing `.env` directly instead of overwriting it.** Set:

```dotenv
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
DEPLOYER_PRIVATE_KEY=0xYOUR_SEPOLIA_TEST_PRIVATE_KEY
INITIAL_ADMIN_ADDRESS=0xYOUR_INITIAL_OWNER_ADDRESS
ETHERSCAN_API_KEY=
```

| Setting | Purpose |
| --- | --- |
| `SEPOLIA_RPC_URL` | Hardhat's Sepolia endpoint. PublicNode is the default and requires no API key; rate limiting is possible. |
| `DEPLOYER_PRIVATE_KEY` | A dedicated test wallet key used to sign deployments locally. That wallet needs Sepolia ETH. |
| `INITIAL_ADMIN_ADDRESS` | Initial owner's public address. Set explicitly to avoid ambiguity. If empty, deployment first tries the chain's first admin in `contracts/test-accounts.json`, then the deployer. The repository's Sepolia admin list is empty by default. |
| `ETHERSCAN_API_KEY` | Not used by the current deploy, export or read-only check scripts; leave empty. These steps do not automatically verify contract source on Etherscan. |

Keep the private key only in local `contracts/.env`, never in GitHub, Cloudflare, frontend variables or administrator inputs. Deployment scripts sign locally, so MetaMask does not open. Both local-key signing and MetaMask signing produce real testnet transactions and pay gas.

### Step 3 — Check, deploy and export

Run in order. Resolve a failure before moving to the next command:

```bash
npm run check:sepolia --prefix contracts
npm run build --prefix contracts
npm test --prefix contracts
npm run deploy:sepolia --prefix contracts
npm run export:sepolia --prefix contracts
npm run smoke:sepolia --prefix contracts
```

| Command | Purpose and output | Sepolia gas? |
| --- | --- | --- |
| `check:sepolia` | Reads the RPC chain ID and latest block. No private key required. | No |
| Contract `build` | Compiles Solidity into local ABI and bytecode artifacts. | No |
| Contract `test` | Runs isolated simulated-chain tests, without changing public Sepolia or populating a manually running local node. | No |
| `deploy:sepolia` | Deploys a new `CopyrightMarket`, waits for its receipt, and writes `contracts/deployments/11155111.json`. | **Yes** |
| `export:sepolia` | Exports ABI and deployment information to `frontend/src/generated/`, retaining the other network's record. | No |
| `smoke:sepolia` | Reads deployed code, owner, terms version and the batch limit `20`. | No |

Save the printed `0x...` contract address. **Each `deploy:sepolia` creates a new empty instance; it does not upgrade the old address.** Local sample data is never automatically created on Sepolia.

### Step 4 — Configure Cloudflare Workers

An existing `workers.dev` project can keep its project and URL. For a first deployment, create a Git-connected Worker in Cloudflare **Workers & Pages** and select the deployment branch. Private repositories can be used by granting Cloudflare access.

| Setting | Value |
| --- | --- |
| Root directory | Repository root: blank or `.` |
| Build command | `npm ci --prefix frontend && npm run build --prefix frontend` |
| Deploy command | `npx wrangler deploy` |
| Project name | `copyright-ark`, matching `name` in `wrangler.jsonc` |

The build command installs frontend dependencies, then runs TypeScript checks and Vite bundling. `&&` runs the second command only if the first succeeds. Wrangler uploads the build output. `wrangler.jsonc` already selects `frontend/dist` and SPA routing; do not upload the whole repository or add `--assets .`. No R2, D1 or application backend is needed.

In **Project → Settings → Build → Build variables and secrets**, add or edit these text variables. They are consumed during Vite compilation, separately from runtime Variables & Secrets. [Official Workers build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#build-settings)

| Variable | Value |
| --- | --- |
| `NODE_VERSION` | `24.15.0` |
| `VITE_DEFAULT_CHAIN_ID` | `11155111` |
| `VITE_SEPOLIA_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com`, or another publicly usable Sepolia RPC |
| `VITE_SEPOLIA_MARKET_ADDRESS` | The newly deployed contract address, not a wallet or local-contract address |

`VITE_*` values are public in browser assets. An environment address overrides `frontend/src/generated/deployments.json`; updating only the exported file while retaining an old environment value still connects to the old contract. Rebuild after changing variables.

### Step 5 — Commit and trigger a build

Check the frontend locally:

```bash
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

The first command runs frontend tests once and exits; omitting `--run` starts watch mode. The second checks TypeScript and creates `frontend/dist`. Neither sends public-chain transactions.

Inspect the changes:

```bash
git status --short
git diff --check
```

The first lists changed files; the second checks patch whitespace. Check that no `.env` or other key files are included. Public ABI and deployment records should be committed. After reviewing all changes:

```bash
git add README.md README.zh-CN.md docs contracts frontend wrangler.jsonc
git commit -m "Update Copyright Ark deployment and interface"
git push
```

`git add` stages non-ignored changes in those files/directories; `git commit` records a local revision; `git push` uploads the current branch, assuming its remote tracking branch is configured. Use the production branch watched by Cloudflare. Pushing triggers the Git build; if the code is already pushed and only variables changed, select **Retry build** in the build history.

After success, open the dashboard URL, typically `https://<worker-name>.<account-subdomain>.workers.dev`. Refreshing `/discover` or `/offers` should work. The new contract begins empty; register works and follow section 1.

Pages is also supported: use the same root and build command, output `frontend/dist`, and no Workers deploy command. Configure build variables in the Pages project settings and use its `pages.dev` URL. See the [official Pages guide](https://developers.cloudflare.com/pages/get-started/git-integration/).

### Step 6 — Future updates

| Change | Required work |
| --- | --- |
| README, styling or ordinary frontend code | Check/build, commit and push for a new Cloudflare build. No contract deployment. |
| Solidity, especially adding `createOffers` | Compile/test, redeploy, export, update the Cloudflare contract address, and rebuild. Old contracts lack new methods. |
| Cloudflare build variables | Save and rebuild; refreshing the website alone has no effect. |
| Administrator list | Current owner synchronizes it in `/dev`; no frontend rebuild. |

Keep the previous contract address before switching. Old works, licenses, deposits, claimable funds and permissions stay there without automatic migration. Handle needed old funds through the old deployment; unexpired deposits still obey the old terms. Authorize additional administrators again on the new contract.

## 3. Running locally

### Step 1 — Download, install and understand the terminals

Follow section 2, step 1 to obtain the repository, prepare Node.js and install both dependency sets. Skip already completed installation. **Both terminals must be in the same repository root.**

- Terminal 1 runs the Hardhat node continuously.
- Terminal 2 deploys samples and exports the interface, then runs the frontend continuously.

`npm test` does not start a long-running browser-accessible node. Starting a node alone does not populate sample works. Follow the sequence below.

### Step 2 — Terminal 1: start the blockchain

```bash
npm run node --prefix contracts
```

This starts RPC at `http://127.0.0.1:8545`, chain ID `31337`. It prints test account addresses and private keys, with large local ETH balances. These balances do not exist on Sepolia. Keep this terminal running without using it for further commands.

Hardhat numbers accounts from `Account #0`. Default roles are below; the sample script's printed addresses are authoritative:

| Role | Hardhat account | Default use |
| --- | --- | --- |
| Owner / administrator | `#0`, the first account | Administrator permissions, cases and reward pool |
| Main author | `#1`, the second account | 24 sample works and 50 offers |
| Main buyer | `#2`, the third account | 20 sample licenses |
| Second author | `#3`, the fourth account | Another 6 works and 8 offers |
| Second buyer | `#4`, the fifth account | Another 4 licenses |

The first account is `#0`, not `#1`. For the first three roles, the sample script prefers addresses in `contracts/test-accounts.json` that the node actually controls, then falls back to defaults. Frontend defaults in `frontend/src/dev/test-accounts.json` contain only administrator public addresses, never private keys.

### Step 3 — Terminal 2: compile, seed and export

With the node running:

```bash
npm run build --prefix contracts
npm run seed:local --prefix contracts
npm run export-interface --prefix contracts
```

| Command | Purpose |
| --- | --- |
| `build` | Compiles the current Solidity version. |
| `seed:local` | Restricted to `31337`: deploys a contract, creates 30 works, 58 offers, 24 licenses and 3 cases, then verifies wallet balances and contract accounting. |
| `export-interface` | Connects to local RPC and writes the ABI and deployment record to frontend generated files, preserving the Sepolia record. |

The script does not advance chain time. Some examples expire after one real hour. Works #1, #25 and #26 have multiple available offers with different prices and durations. Samples include active, cancelled, author-revoked and invalidated-registration scenarios.

Repeating `seed:local` on the same node is rejected to avoid replacing the current test deployment. **Do not run `deploy:local` followed by `seed:local`**; each deploys a contract. For an empty deployment, replace seeding with:

```bash
npm run deploy:local --prefix contracts
npm run export-interface --prefix contracts
```

The first command deploys and records an empty contract; the second exports that interface. No sample works or licenses are created.

### Step 4 — Configure the local frontend

Only if `frontend/.env` does not already exist:

```bash
cp frontend/.env.example frontend/.env
```

This copies the template; edit an existing file directly to avoid overwriting settings. Set:

```dotenv
VITE_DEFAULT_CHAIN_ID=31337
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
VITE_LOCAL_MARKET_ADDRESS=
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_SEPOLIA_MARKET_ADDRESS=
```

A blank local address uses the freshly exported record. To also test Sepolia from this frontend, use a valid Sepolia export or set `VITE_SEPOLIA_MARKET_ADDRESS`. A Sepolia deployment is not required for local-chain testing. Restart Vite after editing `.env`.

`VITE_DEFAULT_CHAIN_ID` controls the initial default; a browser's saved network preference can take precedence. Confirm Hardhat in the developer menu after starting.

### Step 5 — Terminal 2: start the frontend

```bash
npm run dev --prefix frontend
```

This starts Vite, usually at `http://127.0.0.1:5173`; use the printed URL because the port may change if occupied. Keep terminal 2 running and open that local URL. Both terminals should now remain active.

### Step 6 — Add Hardhat Local and import accounts into MetaMask

1. Open MetaMask's network selector and add a custom network.
2. Set name `Hardhat Local`, RPC `http://127.0.0.1:8545`, chain ID `31337` and currency `ETH`. Leave the block explorer blank.
3. Find the private key associated with `Account #0` in terminal 1.
4. In MetaMask's account menu, add/import an account **using a private key** and name it `Local Admin`. A single-account private key is not a recovery phrase.
5. Repeat for `#1` and `#2`, named `Local Author` and `Local Buyer`. Import `#3` and `#4` only if testing the second author/buyer scenarios.
6. Select Hardhat Local, connect to the local site and choose the local chain in `/dev`. When changing accounts, verify the address displayed by the website and allow the new account to connect if necessary.

These are publicly known development keys: use them only locally and never fund their public-chain addresses. Inventing an address does not create a signing wallet. The default node normally generates the same accounts after restart, but chain data and nonces reset.

### Step 7 — Use samples and switch networks

Start with `Local Author` in My offers, switch to `Local Buyer` to accept an offer from Discover, and use `Local Admin` for Admin. Other actions follow the test table in section 1.

The developer menu switches all business reads and operations between local and Sepolia contracts. MetaMask must match the selected business network before a write. Switching does not copy data across chains. The default local owner is `#0`; that owner must sign a full-list update to authorize extra administrators. The menu does not permit visitors to grant themselves permissions.

Seeding uses unlocked test accounts controlled by the Hardhat node, without MetaMask popups. Local transactions still execute real contract accounting and gas deductions on the local chain. Manual frontend actions request MetaMask signatures instead.

### Step 8 — Stop and resume

Press `Ctrl+C` in terminal 2 to stop Vite; press `Ctrl+C` in terminal 1 to stop Hardhat. Stopping only Vite leaves the running blockchain intact.

After stopping both:

1. In terminal 1, run `npm run node --prefix contracts` again and keep it running.
2. In terminal 2, repeat the compile/seed/export commands from step 3, then run `npm run dev --prefix frontend`.
3. Refresh the website and verify its network and deployment. Address overrides must be blank or match the new deployment.

You do not need to reinstall dependencies or import identical keys each time. Hardhat loses its in-memory state on shutdown. If MetaMask reports a stale nonce after restart, inspect the version's clear-activity/nonce setting only for the local test account; do not reset the whole wallet.

## 4. Test commands and troubleshooting

```bash
npm test --prefix contracts
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

These run isolated contract tests, frontend tests once, and a production build. The current suite contains 10 contract and 26 frontend tests. They do not start a background preview or replace real MetaMask/Sepolia acceptance testing.

| Symptom | Check |
| --- | --- |
| No local-chain switch on the hosted site | Expected: hosted sites use Sepolia only. Run locally to test Hardhat. |
| No local samples | Confirm seeding, interface export and local-chain selection in `/dev`. |
| Old data or transactions to a new method fail | Check network, deployed version and Cloudflare address override; rebuild after updates. |
| No wallet prompt for registration/offers | Check connected account, valid fields and matching networks. Insufficient funds or simulation errors may prevent submission. |
| Insufficient balance | Authors need total deposit plus gas; buyers need price plus gas. Claimable funds must be withdrawn before becoming wallet funds. |
| Expired license but locked deposit remains | Validity is separate from settlement; the frontend currently lacks this settlement button. See the mechanism document. |
| Script transactions or receipts absent from MetaMask Activity | Activity is not a full blockchain ledger. Check hashes, explorer and contract balances. |
| Some licenses missing from lookup | Current `/verify` reads only the buyer's first 50 licenses; later records may still exist. |

## 5. Copyright mechanism and further reading

Registration is a rights declaration, not automatic ownership verification. The platform does not upload originals, automatically determine infringement or deliver files. These documents describe the current permissions, transactions, deposits, breach handling, cases, historical lookup and interface boundaries:

- **[Detailed copyright management mechanism (English)](docs/COPYRIGHT-MECHANISM.md)**
- [版权管理机制详解（中文）](docs/COPYRIGHT-MECHANISM.zh-CN.md)
- [Standard license terms v1 (English)](docs/LICENSE-TERMS-V1.en.md) / [中文](docs/LICENSE-TERMS-V1.md)
- [Local sample IDs, accounts and balance checks (Chinese)](docs/LOCAL-SAMPLES.md)
- [Additional Cloudflare deployment and acceptance reference (Chinese)](docs/DEPLOY-CLOUDFLARE.md)
