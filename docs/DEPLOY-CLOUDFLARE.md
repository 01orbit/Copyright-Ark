# Copyright Ark：Cloudflare 部署与测试完整教程

本教程按你指定的流程：**先把网站和封面服务部署到 Cloudflare，再让线上网站连接你电脑上的本地 Hardhat 测试，最后部署并测试 Sepolia 合约。**

## 部署结构

| 部分 | 运行/存储位置 | 用来做什么 |
| --- | --- | --- |
| React 前端 | Cloudflare Pages | 助教访问的网站 |
| 封面接口 | Cloudflare Worker | 验证签名、提供公开读取 |
| 封面文件 | Cloudflare R2 | 保存公开 WebP 封面 |
| 第一阶段业务数据 | 你的电脑上的 Hardhat Local | 本地合约、作品、许可及余额 |
| 第二阶段业务数据 | Sepolia | 公开测试网合约及其链上数据 |

Cloudflare **不运行 Hardhat，也不托管 Solidity 合约**。线上网站在本地链阶段直接从访问者浏览器请求你的 `127.0.0.1:8545`。因此你的 Hardhat 电脑必须保持开机、节点持续运行，浏览器也必须允许线上网站访问本机网络。助教的 `127.0.0.1` 是助教自己的电脑，无法连接你的电脑。本地链适合你自己演示功能；需要让助教异地查看同一份链上数据时，使用 Sepolia。

本教程中，所有占位文字都要替换成自己的实际值，不要原样粘贴。命令中注明“新终端”的地方，请保留已有终端继续运行。

---

## 阶段 0：准备账号与工作区

### 第 1 步：准备这些东西

- 一个 GitHub 账号和一个私有仓库。私有仓库能部署，部署后的网页仍可以公开访问。
- 一个 Cloudflare 账号。后续会创建 Pages、Worker 和 R2 bucket。
- MetaMask 浏览器扩展。
- 一个专门的 Sepolia 测试钱包，以及少量 Sepolia 测试 ETH。Hardhat 的公开演示私钥只用于本地链，**不要在 Sepolia、主网或真实资产钱包中使用**。
- 本机安装 Node.js `24.15.0`。项目根目录有 `.nvmrc`；装有 nvm 时：

```bash
cd /home/song-zirui/coding_life/copyright-dapp
nvm install
nvm use
node -v
```

确认版本输出 `v24.15.0`。没有 nvm 时，用 Node.js 版本管理器或安装包安装 `.nvmrc` 中的版本。

### 第 2 步：安装三个工程的依赖

保持在项目根目录，执行：

```bash
npm ci --prefix contracts
npm ci --prefix frontend
npm ci --prefix cover-worker
```

如果看到依赖安装成功后返回命令提示符，就可以继续。三个子目录各有独立依赖和 lock 文件，不要只安装根目录依赖。

### 第 3 步：创建空的 GitHub 私有仓库

在 GitHub 网页点击创建 repository：

1. 选择 **Private**。
2. 仓库名可用 `copyright-dapp`。
3. 暂时不要勾选“Add a README”“Add .gitignore”或选择 License，让它保持空仓库。
4. 复制仓库的 HTTPS 地址，稍后用于 `git remote add origin`。

如果仓库已经建好，确认它是私有仓库且你有写入权限即可。

### 第 4 步：初始化 Git（仅首次）并检查忽略规则

本工作区没有 `.git` 目录。如果这是第一次把该目录推到 GitHub，先确认 `pwd` 是本项目，再执行：

```bash
git init -b main
```

如果目录已经有 `.git`，**不要重复 `git init`**；跳过它并用下面命令检查已有 remote：

```bash
git remote -v
```

接下来检查忽略与工作树状态：

```bash
git check-ignore contracts/.env frontend/.env cover-worker/.dev.vars
git status --short
git add .
git diff --cached --stat
git status --short
```

`git check-ignore` 应列出三个本地配置文件。仔细检查暂存清单，确认没有 `.env`、`.dev.vars`、私钥、Cloudflare API Token、助记词、本地 `.wrangler/` 数据或 `node_modules/` 后再继续。`.env.example` 和 `.dev.vars.example` 是不含真实秘密的示例，可以提交。

然后提交；remote 已存在时跳过 `git remote add`：

```bash
git commit -m "Prepare Copyright Ark for Cloudflare"
git remote add origin https://github.com/你的GitHub用户名/copyright-dapp.git
git push -u origin main
```

将用户名和仓库名替换为 GitHub 显示的实际值。已有 remote 就跳过 `git remote add origin ...`，然后 commit/push。GitHub 要求验证身份时，使用 Git Credential Manager、GitHub CLI 登录或 SSH；不要把 Personal Access Token 拼进远程地址或写进项目文件。

推送后在 GitHub 仓库页面确认能看到三个子目录、`shared/`、各自的 `package-lock.json`、`frontend/src/generated/` 与 `frontend/public/_redirects`。确认 `.env` 和 `.dev.vars` 看不到。

---

## 阶段 1：先部署 Cloudflare 网站与封面服务

仓库里可能已有旧的 `31337` 示例部署记录；它不保证对应你新启动的 Hardhat 节点。网站可以先部署成功，但本地节点还未启动/部署时业务数据不可用；随后必须重新部署本地合约、重新导出地址并更新 Pages 构建。

### 第 5 步：开通 R2 并创建封面 bucket

登录 Cloudflare 控制台，在 **Storage & databases → R2** 按页面流程启用 R2。Cloudflare 可能要求添加付款方式或完成订阅流程，具体以账户控制台显示为准。标准存储有月度免费额度，但超过额度会按量收费。如果目前不想开通 R2，可以仍部署前端，但要跳过本节第 6 步和第 12 步、不要部署 Worker，并在 Pages 留空 `VITE_COVER_API_URL`；页面会使用类型图标。要测试多人共享封面，则完成 R2 开通并继续下面步骤。

Cloudflare 账单方式准备好后，在电脑打开终端：

```bash
cd /home/song-zirui/coding_life/copyright-dapp/cover-worker
npx wrangler login
npx wrangler r2 bucket create copyright-ark-covers
```

`wrangler login` 会通过浏览器让你授权本机 CLI。成功后输出类似“Successfully logged in”。bucket 创建成功后，本教程将其称为“R2 bucket”。如果 Wrangler 报 bucket 已存在，表示之前已创建，直接继续。部署时使用 Standard 存储；不要打开 r2.dev 公开 bucket。

### 第 6 步：先配置 Worker 的测试模式

在编辑器打开 `cover-worker/wrangler.jsonc`。首次本地链阶段使用：

- `r2_buckets[0].bucket_name` 保持 `copyright-ark-covers`。
- `ENABLE_LOCAL_UPLOADS` 设为 `"true"`，因为第一阶段要从线上网站上传本地链作品的封面。
- `SEPOLIA_MARKET_ADDRESS` 先保持空字符串；尚未部署 Sepolia 合约。
- `SEPOLIA_RPC_URL` 可保持 PublicNode 默认值。
- `ALLOWED_ORIGINS` 暂时可以保留示例本地地址；得到 Pages 地址后在第 12 步填入真实网站地址。

为线上本地链封面测试创建独立口令，不要复用钱包密码。在新终端运行：

```bash
openssl rand -hex 24
```

先把随机输出临时记下来，后面设置 Cloudflare Worker Secret 时会输入。不要将其粘贴进 `frontend/.env`、`frontend` 环境变量、GitHub 代码、聊天记录或截图。拥有该口令的人能够向本地链封面分区上传封面；它不代表链上权属认证。

部署 Worker 与 bucket：

```bash
npm test
npm run build
npm run deploy
npx wrangler secret put LOCAL_UPLOAD_TOKEN
```

`build` 只是检查 TypeScript 并预演打包；`deploy` 才会发布 Worker。最后一条按提示粘贴刚生成的口令后回车。终端不显示密码通常是正常的。记下 deploy 输出的 `workers.dev` HTTPS 地址，称为“Worker 地址”。

检查 Worker 是否在线：在浏览器访问 `https://你的Worker地址/health`，页面应显示 `ok`。根路径显示 `NOT_FOUND` 是正常的。

每当 Worker 的 `wrangler.jsonc` 普通配置变更，要重新运行 `npm run deploy`。Secret 存在 Cloudflare，不在 wrangler 文件中，也不会被 Git 提交。

### 第 7 步：创建 Cloudflare Pages 项目

先创建 Pages 项目，让 Cloudflare 给你一个固定的 `项目名.pages.dev` 地址：

1. Cloudflare 控制台进入 **Workers & Pages**，选择创建应用，再选择 Pages 和 Git 集成（界面文案可能随 Cloudflare 更新）。
2. 连接 GitHub，并只授权刚创建的私有仓库。
3. 选择 `main` 生产分支。
4. 使用以下配置：

| Pages 设置 | 值 |
| --- | --- |
| Framework preset | `None` |
| Root directory | 留空，使用仓库根目录 |
| Build command | `npm ci --prefix frontend && npm run build --prefix frontend` |
| Build output directory | `frontend/dist` |

**不要将 Root directory 设成 `frontend`。** 前端会读取仓库根目录的 `shared/cover-protocol.ts`；把根目录设为 `frontend` 会令 Pages build 找不到这个共用文件。

添加 Production 环境变量：

| 名称 | 第一次部署填写 |
| --- | --- |
| `NODE_VERSION` | `24.15.0` |
| `VITE_DEFAULT_CHAIN_ID` | `31337` |
| `VITE_LOCAL_RPC_URL` | `http://127.0.0.1:8545` |
| `VITE_SEPOLIA_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` |
| `VITE_LOCAL_MARKET_ADDRESS` | 暂时留空，稍后填实际本地合约地址 |
| `VITE_SEPOLIA_MARKET_ADDRESS` | 暂时留空 |
| `VITE_COVER_API_URL` | 第 6 步 Worker HTTPS 地址，不加末尾斜杠 |

这些 `VITE_*` 变量会进入浏览器构建，都是公开值。合约公开地址和 RPC URL 可以填这里；**私钥、助记词、Worker Secret 绝不能填这里**。

点击 **Save and Deploy**。打开 Pages 的 deployment log，成功应看到 Vite build 完成，并发布 `frontend/dist`。打开 Pages 给的 `https://项目名.pages.dev/` 应能看到首页。此时本地 Hardhat 尚未启动，业务数据暂时不可用，继续下一阶段。

Pages 项目设置的 Production/Preview 环境变量在 build 时注入。改变量后需要重新部署/触发一次新构建；只刷新浏览器不会更新配置。

---

## 阶段 2：线上网站连接你的 Hardhat 本地链

### 第 8 步：在电脑启动 Hardhat 节点

本地链数据库存在 Hardhat 节点进程内存中。**保持该终端一直开着**，不要按 `Ctrl+C`，不要休眠或关闭电脑。

在新终端从项目根目录运行：

```bash
cd /home/song-zirui/coding_life/copyright-dapp
npm run node --prefix contracts
```

首次启动会打印一组本地测试账户与私钥。它们是 Hardhat 默认演示凭据，只适合本地网络，请勿转入或用于真实网络。终端出现 RPC 地址 `http://127.0.0.1:8545` 和账户列表，说明节点已启动。保留这个终端。

**节点重启会清空本地链数据**。重启后旧作品、旧合约地址都会失效，需要重新部署、重新生成示例数据，并更新 Pages。

### 第 9 步：部署本地演示合约并生成示例作品

再开一个终端，回到项目根目录，运行：

```bash
cd /home/song-zirui/coding_life/copyright-dapp
npm run seed:local --prefix contracts
npm run export-interface --prefix contracts
```

第一条脚本会在当前运行中的 Hardhat 节点部署合约、注入本地演示费用池、登记一件示例作品并创建授权挂单。终端输出 `seeded 0x...`。第二条导出当前本地链 ABI 与公开地址到前端构建输入。

**每次 seed:local 都会再部署一份新合约，并重新写入 Work ID #1。** 第一次按本教程执行一次即可。若你只想空白测试，不要用 seed，改为以下命令部署一份空合约：

```bash
npm run deploy:local --prefix contracts
npm run export-interface --prefix contracts
```

两种方案二选一，不要连续都运行。空白测试没有示例作品和已注资的本地费用池。

### 第 10 步：检查导出的本地地址

打开 `contracts/deployments/31337.json`，记录 `deployment.address`；也可运行：

```bash
node -p "require('./frontend/src/generated/deployments.json').deployments['31337'].address"
```

两处地址应一致，且不能是空值。`contracts/deployments/31337.json` 和 `frontend/src/generated/` 都是可以提交的**公开测试部署地址**，不是私钥。

将 `frontend/src/generated/deployments.json` 中 `31337.address` 记作“本地合约地址”。推荐不需要 Pages 环境变量覆盖它，这样 GitHub 推送的 generated 记录就是唯一地址来源。若一定使用 `VITE_LOCAL_MARKET_ADDRESS`，必须把它更新为同一地址，并触发新的 Pages 构建。

### 第 11 步：将本地合约地址更新到线上 Pages

更新构建输入的方式二选一：

**推荐方式：提交导出记录并让 Pages 自动重新构建。**

```bash
cd /home/song-zirui/coding_life/copyright-dapp
git status --short
git add contracts/deployments/31337.json frontend/src/generated/copyrightMarketAbi.ts frontend/src/generated/deployments.json frontend/src/generated/interface-manifest.json
git commit -m "Add local Hardhat deployment record"
git push
```

若 `git status` 显示的 `31337.json` 与 `frontend/src/generated` 没有变化（例如它们早已跟踪），按实际差异 `git add`；不要因命令提示无变化而重新部署合约。到 Cloudflare Pages 的 Deployments 页面等新的 Production deployment 成功。`.env` 不要 add。

**替代方式：在 Pages 配置地址覆盖。** 在 Pages → Settings → Variables and Secrets 的 Production 环境，将 `VITE_LOCAL_MARKET_ADDRESS` 设为这次的本地合约地址，保存后重新部署。此覆盖值优先级高于导出记录。下次重启 Hardhat 后一定要同步更新并重建 Pages。

确认 Pages 部署已经包含当前地址；浏览器强制刷新网站。此时页面才能从你本机 RPC 查询到当前合约。

### 第 12 步：允许封面 Worker 接受线上网站上传

现在 Pages 的固定生产网址已知。编辑本地 `cover-worker/wrangler.jsonc` 的 `ALLOWED_ORIGINS`，例如：

```json
"ALLOWED_ORIGINS": "https://你的项目.pages.dev,http://127.0.0.1:5173,http://localhost:5173"
```

把 `https://你的项目.pages.dev` 替换成 Cloudflare Pages 页面给你的实际 URL，不要加路径和末尾斜杠。多个来源之间用英文逗号隔开。测试助教预览域名时也要加入对应来源；不要放任意通配来源。

在 `cover-worker` 目录发布更新：

```bash
cd /home/song-zirui/coding_life/copyright-dapp/cover-worker
npm run deploy
```

之后把 `wrangler.jsonc` 加入 Git 提交，令设置可复现。确认 Worker 的 `/health` 仍返回 `ok`。已发布封面可以匿名读取，但只有上传时仍须通过权限检查。

### 第 13 步：在 MetaMask 添加 Hardhat Local

在测试的那台电脑打开 MetaMask：

1. 打开网络选择器，选择添加网络 → 手动添加网络。
2. 网络名称：`Hardhat Local`。
3. RPC URL：`http://127.0.0.1:8545`。
4. Chain ID：`31337`。
5. 货币符号：`ETH`。
6. 保存后切换到 `Hardhat Local`。

导入 Hardhat 测试账户：在 MetaMask 的账户菜单选择 **Import account / 导入账户**，逐个粘贴第 8 步本地 Hardhat 终端输出对应账户的私钥，确认导入。作者至少需要第 2 个 Hardhat 账户，管理员至少需要第 1 个，买家至少需要第 3 个。导入的是本地测试私钥，不是在线 Sepolia 部署钱包私钥。MetaMask 网络选择某一账户后，网站右上角连接该账户。

不要导入终端一次打印出的全部 20 个账户。每个需要操作的角色导入一两个即可。账号地址可以在 `/dev` 开发者菜单配置，用来帮助核对角色；这不会授予链上权限。

### 第 14 步：第一次在生产网址测试本地链

#### 先确保访问路径可行

打开线上 `https://项目名.pages.dev`。线上 HTTPS 页面请求本机 HTTP RPC 时，现代浏览器可能弹出访问 localhost/本地网络的权限提示。只有在你确认页面地址是自己的 Pages 网址时才按需允许。浏览器有时会把 loopback、本地网络分别列为权限。Chrome/Edge 的策略随版本而变；如果浏览器始终拦截，先在浏览器网站设置为该 Pages 来源允许 Loopback/Local network，再重新加载页面。

Chrome 142 起，对公网站访问本机 `127.0.0.1` 使用 Local Network Access 权限控制，授权不等于向网页泄露 Hardhat 私钥：RPC 调用只读取数据，交易钱包签名仍由 MetaMask 处理；但已获准的网站能请求你本机开放的服务，因此只在自己的可信 Pages 来源授权。官方介绍：[Chrome Local Network Access](https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access)。

如果浏览器、学校设备管理策略或 MetaMask 不支持这种跨网络连接，**不要为了测试关闭全局浏览器安全设置**。改用本地预览 `http://127.0.0.1:5173` 验证 Hardhat；Cloudflare Pages 部署仍保留，待 Sepolia 阶段再在线验收。

#### 执行本地链测试

1. 确认 Hardhat 节点终端仍运行，不能关闭。
2. 浏览器打开 Pages 正式网址并刷新，点击首页“进入”。
3. 进入开发者菜单，将业务网络切换到“本地链”。确认网络页提示本地链；MetaMask 网络也选择 Hardhat Local。
4. 若开发者菜单提示连接钱包，先连接 MetaMask；确认连接账户是 Hardhat 本地账户。
5. 开发者菜单里“本地链封面测试”栏输入第 6 步设置的 `LOCAL_UPLOAD_TOKEN`，点击保存。该口令只存于当前浏览器标签页会话；每个新标签页需要再填一次。
6. 返回发现页。用 `seed:local` 时应看到示例作品 `示例城市海报` 和挂单；空部署则没有作品。
7. 用作者账户进入登记页，选择一张小型测试图，确认文件名、SHA-256 和真实图片预览，填写标题/简介并勾选权利声明，点击登记。MetaMask 确认本地交易，等待成功后进入详情页。
8. 点击“发布封面 / 重试”，在 MetaMask 签署封面消息。它不是区块链交易，不消耗 Gas。返回发现页应显示真实缩略图，而不是类型图标。
9. 打开新标签页浏览同一个 Pages 网址，重新在开发者菜单输入测试口令只对上传需要（观看无需口令），切到本地链；发现页及详情页应从 R2 读取同一封面。
10. 作者创建授权挂单，确认参数、价格与押金后在 MetaMask 确认。切换到买家账户接受授权，再用 `/verify` 按钱包地址和作品 ID 查询。
11. 最后切管理员账户；可检查管理页。案件奖励来自独立费用池，需要管理员注资才能支付报酬。测试提示地址不代表链上 owner。

若第 6 步忘记口令、输错口令或 Worker 没有启用本地上传，链上作品登记仍可成功，但上传返回错误；修好配置后回到详情页重新选择原文件并发布即可，无需重新登记。

### 第 15 步：理解本地测试的数据位置

| 数据 | 存放在哪 | 停掉/重启的影响 |
| --- | --- | --- |
| Cloudflare 网页 | Cloudflare Pages | 保持在线 |
| 已发布封面 | Cloudflare R2 | 保持云端共享 |
| 尚未上传的封面预览 | 当前标签页内存 | 关标签或刷新后消失，重选文件 |
| Hardhat 合约与作品 | 本地 Hardhat 进程 | 停止节点后清空 |
| 钱包账户及浏览器选择 | MetaMask/当前浏览器 | Hardhat 地址/MetaMask 导入依然在，但链上余额与记录会随节点重启重置 |

Cloudflare 本地 Worker 模拟数据 `.wrangler/state/` 仅在电脑本地；而本教程 Pages 所用 `VITE_COVER_API_URL` 指向线上 Worker，因此它的封面进 R2。

---

## 阶段 3：再部署 Sepolia 并切换线上测试

### 第 16 步：在本机设置隔离的 Sepolia 部署钱包

如果要先检查项目测试，可在项目根目录执行：

```bash
npm run build --prefix contracts
npm test --prefix contracts
npm run check:sepolia --prefix contracts
```

这些不会部署合约；RPC 检查成功应显示 Chain ID `11155111`。

在本机编辑器新建 `contracts/.env`（若已有则编辑，不要覆盖），填入专用测试钱包：

```dotenv
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
DEPLOYER_PRIVATE_KEY=0x你的专用Sepolia测试钱包私钥
INITIAL_ADMIN_ADDRESS=0x你准备在MetaMask中使用的管理员钱包公开地址
```

`DEPLOYER_PRIVATE_KEY` 是这一步唯一需要使用的部署签名密钥。建议它与 `INITIAL_ADMIN_ADDRESS` 对应地址相同，部署后该钱包直接是合约管理员。若分开使用，请确保你控制 admin 地址的钱包，否则你不能执行管理员操作。`INITIAL_ADMIN_ADDRESS` 只是公开地址。

给部署钱包获取 Sepolia 测试 ETH。只从你信任的测试网 faucet 获取，不需为合约交易使用主网真实 ETH。具体可领多少与当前 faucet 规则有关；若部署交易因余额不足失败，按钱包余额和 Gas 提示补足测试 ETH 后重试。

### 第 17 步：部署、导出并验证 Sepolia 合约

在项目根目录按顺序执行：

```bash
npm run deploy:sepolia --prefix contracts
npm run export:sepolia --prefix contracts
npm run smoke:sepolia --prefix contracts
```

部署会产生**真实 Sepolia 测试网交易**，需要测试 ETH 支付 Gas；MetaMask 不参与这个 Hardhat 脚本的签名，私钥由本机 `.env` 使用。只执行一次，保存输出里的合约地址和 Etherscan 链接。`smoke:sepolia` 是只读检查，应显示 chain `11155111`、相同合约地址、owner 和条款版本。

确认以下文件已更新：

```text
contracts/deployments/11155111.json
frontend/src/generated/copyrightMarketAbi.ts
frontend/src/generated/deployments.json
frontend/src/generated/interface-manifest.json
```

把这些**公开地址和 ABI 构建输入**提交并 push，不能提交 `contracts/.env`：

```bash
git status --short
git add contracts/deployments/11155111.json frontend/src/generated/copyrightMarketAbi.ts frontend/src/generated/deployments.json frontend/src/generated/interface-manifest.json
git commit -m "Add Sepolia deployment record"
git push
```

只把 git status 中实际变更的文件 add；若 lock 或其他文件也确实被改动，先检查为何改变，不要不看内容就提交。

### 第 18 步：启用 Sepolia 封面权限

编辑 `cover-worker/wrangler.jsonc`，把 `SEPOLIA_MARKET_ADDRESS` 填成第 17 步地址。确认 `SEPOLIA_RPC_URL` 能访问 Sepolia，随后在 `cover-worker` 目录运行：

```bash
npm test
npm run build
npm run deploy
```

`ALLOWED_ORIGINS` 继续保留 Pages 正式域名。Worker 会通过 Sepolia RPC 核验封面发布者是否为该作品链上登记人。地址为空或不一致时，Sepolia 封面上传会被拒绝。

完成本地链测试后，为安全起见可以把 `ENABLE_LOCAL_UPLOADS` 改回 `"false"`，并重新 deploy；这会禁用云端的本地链封面写入，但**不会影响本地链登记和 Sepolia 封面上传**。若还需要继续本地上传，可保留 `true`，并谨慎保护口令。

### 第 19 步：切换 Pages 默认网络并重新部署

打开 Cloudflare Pages → Settings → Variables and Secrets → Production，设置：

| 变量 | 最终值 |
| --- | --- |
| `VITE_DEFAULT_CHAIN_ID` | `11155111` |
| `VITE_SEPOLIA_MARKET_ADDRESS` | 第 17 步实际地址 |
| `VITE_SEPOLIA_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` |
| `VITE_LOCAL_MARKET_ADDRESS` | 留空以读取已提交的 31337 部署记录；或填当前本地地址 |
| `VITE_LOCAL_RPC_URL` | `http://127.0.0.1:8545` |
| `VITE_COVER_API_URL` | 原 Worker HTTPS 地址 |

保存后触发 **Retry deployment / 新建 production deployment**。成功后重新加载网站。之前在该浏览器选过本地链的话，网络选择保存在浏览器；打开 `/dev` 开发者菜单切回 Sepolia，MetaMask 也确认切到 Sepolia。

每个 Cloudflare 构建环境的 Variables & Secrets 要分别设置。不要只改 Preview 环境却期待 Production 网站改变。

### 第 20 步：完成 Sepolia 在线测试

1. MetaMask 账户菜单导入或选择你控制的 Sepolia 管理员、作者和买家账户。Sepolia 账户应是你自己的测试钱包，不要把 Hardhat 私钥带到 Sepolia。
2. 确认 MetaMask 显示 Sepolia，打开 Pages 网站开发者菜单也显示 Sepolia。
3. 用作者测试钱包登记一件作品，确认 MetaMask 显示目标合约交互，查看交易并等待确认。
4. 在详情页上传封面。MetaMask 弹出普通的消息签名，不应出现发送 ETH 的交易确认；Worker 验证链上注册人与文件哈希后写入 R2。
5. 用其他浏览器或不同电脑打开同一个 Pages 网址和 `/discover`，确认任何访客都能读出 R2 封面；查看封面无需钱包登录。
6. 作者创建挂单；使用买家钱包接受授权并在查询页面核验。每笔写入交易都会消耗少量 Sepolia 测试 ETH。
7. 管理员操作只在 `INITIAL_ADMIN_ADDRESS` 对应 owner 钱包可行。测试案件奖励还要先从管理页注资独立费用池，注资是链上交易、需要测试 ETH。
8. 此时可以关闭 Hardhat；Sepolia 页面和云端封面仍应工作。

两条链的数据不会自动同步。你在本地链登记的作品、许可、余额，不会出现在 Sepolia。要跨电脑长期展示，使用 Sepolia 作品并发布对应封面。

---

## 遇到问题按此检查

### Pages 构建失败，报告找不到 `shared/cover-protocol.ts`

检查 Root directory 是否留空，Build command 是否为：

```bash
npm ci --prefix frontend && npm run build --prefix frontend
```

并检查 `shared/cover-protocol.ts` 已提交到所选 GitHub 分支。

### 页面有导航但没有作品、显示地址缺失

- 本地阶段：Hardhat 是否运行；`contracts/deployments/31337.json` 是否对应当前节点；是否执行 `export-interface` 并 push/重新构建；如果设置了 Pages 的 `VITE_LOCAL_MARKET_ADDRESS`，确认它没有覆盖成旧地址。
- Sepolia 阶段：确认 `VITE_DEFAULT_CHAIN_ID=11155111`，Sepolia 地址实际部署、已导出并重建 Pages。
- 打开浏览器开发者工具 Console/Network 查看 RPC 错误；公共 RPC 可能临时限流。

### 线上网页无法访问本机 Hardhat

确认 Hardhat 终端运行、网址是你正在访问该节点的同一台电脑、MetaMask 网络为 Chain ID 31337。再检查浏览器的该 Pages 网站设置是否阻止本地/loopback 网络访问，并查看浏览器 Console 的 `ERR_NETWORK_ACCESS_DENIED` 或 CORS 错误。学校管理的浏览器可能禁止此功能；使用本地 Vite 预览测 Hardhat，或直接换到 Sepolia。

任何用户打开线上网站时，其 RPC URL 中的 `127.0.0.1` 都是**他自己的电脑**，不是站长电脑。不能用线上网站 + 站长的 localhost 让助教远程共享同一条本地链。

### 页面使用了上一次选的网络

当前网络选择保存在浏览器 `localStorage`。在 `/dev` 菜单手动选正确链，MetaMask 也要同链；Cloudflare 修改构建变量后需完成新的 Pages 构建。

### Worker `/health` 不通或封面没有上传

- `/health` 是否返回 `ok`，Worker 是否重新 deploy 成功。
- `VITE_COVER_API_URL` 是不是 Worker 的 HTTPS 地址，且修改后重新构建 Pages。
- Worker `ALLOWED_ORIGINS` 是否逐字包含浏览器地址栏中的 origin，例如 `https://copyright-ark.pages.dev`；不含路径、末尾斜杠。
- 本地链写封面：Worker `ENABLE_LOCAL_UPLOADS=true`、线上有 Secret `LOCAL_UPLOAD_TOKEN`、当前标签页 `/dev` 保存了相同口令。
- Sepolia 写封面：Worker `SEPOLIA_MARKET_ADDRESS` 与 Pages 当前选择的 Sepolia 地址相同，作品登记人与签名钱包相同，RPC 可用。
- 上传入口只对连接了作品登记钱包的详情页显示。原文件重新选择时必须与链上 SHA-256 相同。

### 封面只显示类型示意图

确保在登记详情页选择了原文件并实际点击“发布封面 / 重试”。生成预览不等于已上传；没登记的封面不会公开。文档首页会公开显示，请先检查内容。Worker 以首次成功上传为准，后续无法覆盖同一作品的封面路径。

---

## 以后日常更新

- 只改页面：Git commit 和 push，Cloudflare Pages 自动 build/deploy。
- 只改 Worker 代码或 `wrangler.jsonc`：在 `cover-worker` 目录 `npm test && npm run build && npm run deploy`。
- 改 Solidity：在目标链**重新部署会创建新地址**，导出对应地址/ABI，更新 Worker/Pages 地址并重新测试。小改前端不要重新部署合约。
- Hardhat 节点重启：重做第 9 步，更新并推送新的本地部署地址；本地链旧数据已清空。不要把新本地地址误填成 Sepolia 地址。
- 不小心把私钥或口令提交 GitHub：只在 `.gitignore` 加规则并不足够，必须立即轮换/撤销已经泄漏的密钥，并从 Git 历史中处理泄漏内容。

## 官方资料

- Cloudflare Pages Git 集成：https://developers.cloudflare.com/pages/get-started/git-integration/
- Pages 构建配置：https://developers.cloudflare.com/pages/configuration/build-configuration/
- R2 开通与用量：https://developers.cloudflare.com/r2/get-started/
- R2 Workers API：https://developers.cloudflare.com/r2/get-started/workers-api/
- Worker Secrets：https://developers.cloudflare.com/workers/configuration/secrets/
- Pages 路由重写：https://developers.cloudflare.com/pages/configuration/redirects/
- Chrome Local Network Access：https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access
