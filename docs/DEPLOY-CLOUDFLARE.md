# Copyright Ark：Cloudflare 部署与逐步验收

本指南按当前代码编写。Cloudflare Pages 负责托管前端；作品、参考链接、授权挂单、许可和案件记录保存在所选 EVM 链上。项目已移除封面上传、Worker 和 R2，因此部署不需要对象存储订阅。登记作品时选取的原文件只在浏览器本地计算 SHA-256，不会上传；可选参考链接会作为公开数据写入合约。

建议按这个顺序验收：先在本机用 Hardhat 验证本地链，再将 Sepolia 合约和静态前端部署到 Cloudflare，最后通过 Pages 网址让助教验收 Sepolia。Sepolia 是公共测试网，任何人都能看到链上数据；MetaMask 交易需要 Sepolia 测试 ETH。

## 0. 准备工具和账号

需要：Node.js、Git、GitHub 账号、Cloudflare 账号、MetaMask，以及一个专门用于 Sepolia 的测试钱包。Cloudflare Pages 的 Git 集成支持公开和私有 GitHub 仓库。[官方 Git 集成说明](https://developers.cloudflare.com/pages/get-started/git-integration/)

在项目根目录打开终端。项目 `.nvmrc` 指定 Node.js `24.15.0`；使用 nvm 时运行：

```bash
nvm install
nvm use
node -v
```

输出应为 `v24.15.0`。Cloudflare Pages 会读取项目根目录的 `.nvmrc`；若构建环境没有采用该版本，可在 Pages 的构建环境变量中设置 `NODE_VERSION=24.15.0`。[官方构建镜像说明](https://developers.cloudflare.com/pages/configuration/build-image/)

先安装并检查合约：

```bash
npm ci --prefix contracts
npm run build --prefix contracts
npm test --prefix contracts
```

安装前端依赖并执行生产构建：

```bash
npm ci --prefix frontend
npm run build --prefix frontend
```

这些命令都从项目根目录运行。构建成功后会生成 `frontend/dist/`。

## 1. 本地链验收（推荐先做）

本地链用于快速试功能，不需要 MetaMask 里的真实资产。Hardhat 测试账户和私钥只适用于本地链。

1. 在第一个终端启动节点，并保持终端运行：

   ```bash
   npm run node --prefix contracts
   ```

2. 打开第二个终端，仍在项目根目录，部署并生成一件示例作品和一个授权挂单：

   ```bash
   npm run build --prefix contracts
   npm run seed:local --prefix contracts
   npm run export-interface --prefix contracts
   ```

   `seed:local` 会部署新合约并写入 `contracts/deployments/31337.json`；`export-interface` 会更新前端 ABI 和本地合约地址记录。Hardhat 节点每次重新启动都会清空链上数据，因此重启后需要重新执行这三条命令。

3. 在 `frontend/.env` 中设置本地链。若文件不存在，可复制 `frontend/.env.example` 后编辑：

   ```dotenv
   VITE_DEFAULT_CHAIN_ID=31337
   VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
   VITE_LOCAL_MARKET_ADDRESS=
   VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   VITE_SEPOLIA_MARKET_ADDRESS=
   ```

   执行过 `export-interface` 后，`VITE_LOCAL_MARKET_ADDRESS` 可以留空，前端会读取生成的部署记录。也可以将部署输出的合约地址填入该变量作为覆盖值。`.env` 是本机配置，不要提交。

4. 启动前端：

   ```bash
   npm run dev --prefix frontend
   ```

   用 MetaMask 浏览器打开终端显示的本地网址。若 MetaMask 没有 Hardhat Local 网络，手动添加：RPC `http://127.0.0.1:8545`、Chain ID `31337`、货币符号 `ETH`。

5. 在 MetaMask 导入 Hardhat 节点输出的本地测试账户。只在 `31337` 网络使用这些账户；不要将这些私钥用于 Sepolia 或主网。开发者菜单中的角色地址仅用于方便核对，不会代替 MetaMask 签名，也不会给钱包授予权限。

6. 本地验收流程：

   - 打开“发现”，确认示例作品可见；打开作品详情，确认示例挂单可见。
   - 使用作者账户在“登记作品”选择任意文件并提交。原文件不会上传；页面会登记标题、简介、类别、文件指纹和可选参考链接。
   - 回到“发现”，确认刚登记的作品出现。若有参考链接，应能直接从缩略作品条目打开；详情页也应能打开。
   - 用作者账户在作品详情创建挂单，再切换买家账户接受授权。
   - 在“使用权查询”填写买家地址并查询；在“账户”检查许可收入、押金和可领取余额等链上数据。
   - 可用管理员账户检查管理页面。案件处理可在空费用池完成；若要测试奖励拨付，管理员需先向独立案件费用池注资，这是一笔本地链交易。

## 2. 部署 Sepolia 合约

Cloudflare 只托管前端，Solidity 合约仍需由 Hardhat 部署到 Sepolia。每次部署都会生成一个新地址，不会覆盖旧合约；作品数据也不会从旧地址迁移。

### 2.1 准备测试钱包和 RPC

1. 准备专门的 Sepolia 测试钱包，并为部署账户领取少量 Sepolia 测试 ETH。不要使用有真实资产的钱包。
2. `contracts/.env.example` 是变量模板。复制为 `contracts/.env`，填写：

   ```dotenv
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   DEPLOYER_PRIVATE_KEY=0x专用Sepolia部署钱包私钥
   INITIAL_ADMIN_ADDRESS=0x担任合约管理员的公开地址
   ETHERSCAN_API_KEY=
   ```

   如果部署钱包也要担任管理员，`INITIAL_ADMIN_ADDRESS` 可留空。私钥只放在本机 `contracts/.env`；不要填入 `frontend/.env`、Cloudflare 的 `VITE_*` 变量、聊天消息或 GitHub。RPC URL、合约地址和钱包公开地址不是私钥，但仍应避免把个人身份信息与其绑定。

3. 先做只读 RPC 检查：

   ```bash
   npm run check:sepolia --prefix contracts
   ```

   成功时应显示 Chain ID `11155111` 和最新区块。该命令不需要私钥或测试 ETH。PublicNode 暂时不可用时，替换 `SEPOLIA_RPC_URL` 为可访问的 Sepolia RPC 再试。

### 2.2 部署并导出合约接口

按顺序运行：

```bash
npm run build --prefix contracts
npm test --prefix contracts
npm run deploy:sepolia --prefix contracts
npm run export:sepolia --prefix contracts
npm run smoke:sepolia --prefix contracts
```

确认部署过程成功后，记录部署脚本输出的合约地址和 Etherscan 页面。部署文件是 `contracts/deployments/11155111.json`；导出的前端接口位于 `frontend/src/generated/`。`smoke:sepolia` 会只读检查合约代码、管理员地址和条款版本。

把 `contracts/deployments/11155111.json` 及 `frontend/src/generated/` 的公开部署信息纳入 Git 提交。它们不含私钥。若这次改动包含 Solidity，前端和 Pages 必须使用新地址；只改前端页面时不必重新部署合约。

## 3. 部署前检查 GitHub 内容

如仓库还未推送到 GitHub，创建一个仓库（私有仓库也可以），并推送当前项目分支。Cloudflare Pages 会根据连接分支的提交自动构建和部署。

提交前检查：

```bash
git status --short
git check-ignore contracts/.env frontend/.env
```

`git check-ignore` 应显示本机 `.env` 文件被忽略。提交前再次检查暂存区，确认没有 `contracts/.env`、`frontend/.env`、私钥、助记词或钱包导出文件：

```bash
git add -A
git diff --cached --stat
git diff --cached
```

`git add -A` 会暂存所有未提交的改动。检查 `git diff --cached` 中确实包含要发布的当前版本，并且没有本机密钥后再提交；如果暂存了不想发布的文件，先在 Git 客户端取消对应文件的暂存。

如果只是正常更新已有分支，按自己的 Git 工作流提交并推送即可：

```bash
git commit -m "Prepare Copyright Ark deployment"
git push
```

不要在已有 Git 仓库中重复执行 `git init`。若私钥曾经提交到 GitHub，仅添加 `.gitignore` 不够，必须立即更换该密钥并处理 Git 历史中的泄漏。

## 4. 创建 Cloudflare Pages 项目

1. 登录 Cloudflare Dashboard，打开 **Workers & Pages → Create application → Pages → Connect to Git**。
2. 授权 GitHub，并选择刚推送代码的仓库和生产分支（通常是 `main`）。Git 集成需要仓库至少已有一个分支提交。
3. 构建配置填写：

   | 设置 | 值 |
   | --- | --- |
   | Root directory | 仓库根目录，留空或填写 `.` |
   | Framework preset | 可选 React (Vite)，也可选 None |
   | Build command | `npm ci --prefix frontend && npm run build --prefix frontend` |
   | Build output directory | `frontend/dist` |

   这是 monorepo：项目根目录包含 `contracts/` 和 `frontend/`，因此不要把 Root directory 改成 `frontend`，否则上面的根目录命令和输出路径就不匹配。Pages 从仓库根目录开始构建，输出目录必须与实际构建结果一致。[构建配置说明](https://developers.cloudflare.com/pages/configuration/build-configuration/) · [monorepo 配置说明](https://developers.cloudflare.com/pages/configuration/monorepos/)

4. 设置 Pages 的构建环境变量（首次创建时可在设置阶段添加，也可部署后到 **Settings → Environment variables** 添加）：

   | 变量 | 建议值 | 说明 |
   | --- | --- | --- |
   | `NODE_VERSION` | `24.15.0` | 与根目录 `.nvmrc` 一致；若 Cloudflare 已正确读取 `.nvmrc`，可以不单独设置 |
   | `VITE_DEFAULT_CHAIN_ID` | `11155111` | 让首次进入的业务网络为 Sepolia |
   | `VITE_SEPOLIA_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` | 可留空使用代码默认值；这是公开 RPC，不是秘密 |
   | `VITE_SEPOLIA_MARKET_ADDRESS` | 第 2 步部署得到的 `0x...` 地址 | 指定新合约；不要填 Hardhat 本地地址 |
   | `VITE_LOCAL_RPC_URL` | `http://127.0.0.1:8545` | 可留空使用默认值，仅用于本机访问本地 Hardhat |
   | `VITE_LOCAL_MARKET_ADDRESS` | 本地链合约地址，或留空 | Pages 需要构建时包含最新本地部署记录，才能通过菜单切换到这份本地合约 |

   `VITE_*` 变量会编译进浏览器文件，任何网站访问者都能查看。只在这里放 RPC 地址和合约地址等公开配置，**不要放私钥、助记词、API 管理密钥或秘密令牌**。修改环境变量后要重新触发 Pages 构建，新值才会进入前端。

5. 点击 **Save and Deploy**。等构建状态显示成功后，打开 Cloudflare 提供的 `https://<项目名>.pages.dev` 地址。Git 集成部署和构建目录的配置细节见 [Cloudflare Pages 官方指南](https://developers.cloudflare.com/pages/get-started/git-integration/)。

6. 在 Pages 网址刷新 `/discover`、`/works/1` 等子路径，确认 React 路由仍能打开。项目通过 `frontend/public/_redirects` 将路由交给单页应用处理；如果深层链接刷新得到 404，确认该文件已提交且出现在构建产物中。

## 5. 通过 Cloudflare Pages 验收 Sepolia

助教跨电脑验收时应使用 Sepolia。Sepolia 是同一条公共链，作品和许可可由所有连接到同一合约地址的访问者查看；本地 Hardhat 数据不会同步到 Sepolia。

1. 确认 Cloudflare 的生产构建使用新部署的 `VITE_SEPOLIA_MARKET_ADDRESS`，随后在页面顶栏选择 Sepolia。钱包也应切换到 MetaMask 的 Sepolia 网络，开发者菜单会显示当前选择的业务链和钱包链状态。
2. 未连接钱包时检查首页、语言切换、发现页、作品详情和参考链接。发现列表为空不一定是故障：新部署的合约没有旧合约的数据，需要先登记作品。
3. 准备两个或更多已领取 Sepolia 测试 ETH 的钱包，分别作为管理员、作者和买家。用 MetaMask 当前账户连接网站；切换 MetaMask 账户后，确认顶栏显示的账户地址改变。
4. 用作者钱包打开“登记作品”：

   - 选择一份本地文件，填写标题、简介、类别并勾选权利声明。
   - 参考链接为可选项。若填写，只使用可公开访问的 `http://` 或 `https://` 地址，不放私人链接、访问令牌或敏感信息。
   - 提交后在 MetaMask 确认交易，等待页面显示成功。

   原文件不会上传或保存到 Cloudflare；文件指纹和登记元数据写入链上。参考链接也会公开写入链上。

5. 打开“发现”，确认作品出现；若登记了参考链接，可直接点击缩略作品条目上的链接，并在作品详情页再次检查链接。点击链接会离开 DApp 打开第三方网站，目标内容的安全性由访问者自行判断。
6. 打开作品详情，用作者钱包创建授权挂单。按表单填写价格、期限、押金、接受截止时间和使用范围，MetaMask 会要求签名并支付交易费用及合约要求的挂单金额。
7. 切换到买家钱包，在同一作品详情接受挂单并确认交易。随后到“使用权查询”输入买家地址，查询作品许可；在“账户”查看链上余额和押金状态。
8. 测试管理员页面时，使用部署时指定的 `INITIAL_ADMIN_ADDRESS` 对应钱包。若还要测试案件奖励，先由管理员给独立案件费用池注资；该池与授权押金分开，注资和拨付都需要交易。普通登记、挂单、授权和查询不要求先做管理员操作。
9. 也可以在 `/dev` 为本机浏览器填写管理员、作者、买家等公开测试地址，方便识别角色。覆盖保存在当前浏览器，不会修改服务器上的配置，也不会让填写的地址获得合约权限；MetaMask 账户和合约权限仍是实际校验依据。

## 6. Pages 上切换到本地链（可选）

线上 Pages 访问者的浏览器会把 `127.0.0.1` 解释为**访问者自己的电脑**。因此该模式只适合你在运行 Hardhat 节点的同一台电脑上演示；助教的电脑无法通过这个地址连接你的本机节点。

1. 先按第 1 节启动 Hardhat、运行 `seed:local` 并导出接口。
2. 确认 `contracts/deployments/31337.json` 和 `frontend/src/generated/deployments.json` 中的本地地址是刚启动节点本次部署的地址。
3. 将更新后的 `frontend/src/generated/` 推送到 GitHub，并让 Cloudflare Pages 完成新构建。若使用环境变量覆盖本地地址，设置 `VITE_LOCAL_MARKET_ADDRESS` 后也要重新部署 Pages。
4. 在同一台电脑上打开 Pages 网站，从“开发者菜单”选择本地链，并让 MetaMask 切换到 Chain ID `31337`。
5. 如果浏览器拒绝 Pages 网站访问本地网络，或控制台显示本地网络权限错误，请用本地 Vite 网站测试 Hardhat；不要把 `127.0.0.1` 换成 `0.0.0.0` 就公开 Hardhat 节点。Cloudflare HTTPS 页面访问本机 HTTP RPC 还可能受浏览器本地网络/混合内容策略限制。

本地链每次重启都会清空作品、挂单和余额。Pages 上某次构建包含的本地合约地址，也不会自动跟随你之后重新部署的本地合约；重启节点后应重新 seed、导出，并重新构建前端，或直接用本地 Vite 预览。

## 7. 每次更新如何发布

- 只改前端：提交并推送 GitHub，Cloudflare Pages 会构建新的部署。
- 改了 Solidity：运行合约编译和测试，在目标链重新部署，运行对应的 `export-interface` 或 `export:sepolia`，更新 Pages 的 Sepolia 地址并重新构建。旧合约数据仍在旧地址，不会自动搬迁。
- 只改测试地址：仓库默认配置是公开钱包地址；部署后每位测试者也可以在 `/dev` 用本地浏览器覆盖。不需要部署 Worker 或数据库。
- 改 Pages 环境变量：保存后重新部署或重新触发一次构建。

## 8. 常见问题

| 现象 | 检查方法 |
| --- | --- |
| Pages 构建报找不到 `frontend` 或输出目录 | Root directory 使用仓库根目录；构建命令为 `npm ci --prefix frontend && npm run build --prefix frontend`；输出为 `frontend/dist`。 |
| 页面可以打开，但显示没有合约地址 | 检查 `VITE_SEPOLIA_MARKET_ADDRESS`、`frontend/src/generated/deployments.json` 和部署分支是否一致，然后重新构建 Pages。 |
| Sepolia 读取失败或交易失败 | 确认开发者菜单和 MetaMask 都选择 Sepolia（`11155111`）、合约地址属于 Sepolia、RPC 可用、钱包有测试 ETH。公共 RPC 可能限流。 |
| 登记交易成功，但发现页没出现 | 确认页面仍连接同一网络、同一个合约地址；不同链或不同合约地址的数据不会合并。 |
| 买家无法接受挂单 | 检查挂单仍有效、接受截止时间未过、买家不是作品作者本人，并确认 MetaMask 与页面所选网络相同。 |
| 管理页面提示无权限 | 当前钱包必须是该合约的 owner；开发者菜单中的管理员地址只是显示/测试辅助，不能改写链上 owner。 |
| Hardhat 重启后本地数据消失 | 这是预期行为；重新运行 `npm run seed:local --prefix contracts` 和 `npm run export-interface --prefix contracts`，然后重新启动或刷新前端。 |
| Pages 本地链模式无法连接 | 确认浏览器和 Hardhat 在同一台电脑，节点监听 `127.0.0.1:8545`，MetaMask Chain ID 为 `31337`；浏览器限制时改用本地 Vite 预览。 |
| 参考链接在详情可见但打开失败 | 检查它是否是有效 HTTP(S) 地址、目标站点是否仍在线；合约只存字符串，不验证目标站点内容。 |

## 官方资料

- [Cloudflare Pages Git 集成与首次部署](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages 构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages monorepo 配置](https://developers.cloudflare.com/pages/configuration/monorepos/)
- [Cloudflare Pages 构建镜像与 Node.js 版本](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Cloudflare Pages 重定向和 SPA 路由](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
