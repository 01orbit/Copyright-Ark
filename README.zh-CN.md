# Copyright Ark

[English](README.md) | [简体中文](README.zh-CN.md)

Copyright Ark 是一个去中心化版权管理平台，支持登记作品文件指纹、发布非独占使用许可和购买授权。作者押金用于支付许可提前终止时的退款与补偿。界面支持中英文，默认使用英文。

前端使用 React、TypeScript、Vite、Tailwind CSS 4、HeroUI 3、Wagmi/Viem；合约使用 Solidity 0.8.28、Hardhat 3、OpenZeppelin。源码分别在 `frontend/`、`contracts/`，文档在 `docs/`，不需要数据库或对象存储订阅。

快速跳转：[线上使用](#一线上使用) · [Cloudflare 部署](#二部署到-cloudflare) · [本地运行](#三本地运行) · [排错](#四测试命令与排错) · [机制详解](#五版权管理机制与进一步阅读)。

**先选择你要使用的版本：**

| 使用方式 | 访问哪条链 | 需要运行什么 | 数据保存位置 |
| --- | --- | --- | --- |
| 直接访问线上网址 | 仅 Sepolia（`11155111`） | 访问者只需浏览器和 MetaMask | Sepolia 上的指定合约 |
| 下载仓库后本机启动 | Hardhat 本地链（`31337`），也可切换 Sepolia | 本地链测试时保持两个终端运行 | 本地节点内存，或所选 Sepolia 合约 |

Cloudflare 托管前端静态文件，不负责运行本项目的 Hardhat 节点。线上和本地不是两套业务代码，而是同一前端按访问环境限制可用网络；不同链、不同合约地址的数据互不相通。

## 一、线上使用

### 1. 准备钱包

项目网址：[Copyright Ark](https://copyright-ark.zsong2308.workers.dev/)。开发者菜单中可以查看当前合约的 owner 和已授权管理员。

只访问已经部署好的网站时，**不需要下载仓库、安装 Node.js、运行命令或启动本地链**。

1. 在浏览器安装并设置 MetaMask。
2. 建议准备三个专用测试账户：管理员、作者、买家。账户可以放在同一个 MetaMask 中，测试时切换；每个发送交易的账户都需要 Sepolia 测试 ETH。
3. 在 MetaMask 中显示测试网络并选择 **Sepolia**，Chain ID 为 `11155111`。本项目不使用主网 ETH。
4. 为作者和买家领取测试 ETH；管理员录入案件和同步权限也要付 Gas。作者还需支付挂单押金，买家支付许可价格。Gas 随网络变化，没有固定的最低余额。

作者、买家可以是任何你控制的钱包，不需要在配置文件或开发者菜单预先登记。新建一个账户不会自动变成管理员：只有链上 owner 和被 owner 授权的地址具有管理权限。访问者自己的三个新账户通常只有作者、买家功能；要验收管理功能，需要当前 owner 授权。

### 2. 确认网络和合约

1. 打开首页，点击进入，到达 **Discover / 发现**。
2. 点击顶部连接钱包按钮，并在 MetaMask 确认连接。连接本身不转账。
3. 打开 **Developer / 开发者菜单**（`/dev`），核对 owner、额外管理员和当前业务网络。线上只显示 Sepolia，不提供本地链开关。
4. 若要核对网站使用的合约地址，查看部署者提供的部署记录或 Cloudflare 构建配置。**钱包地址和合约地址不是同一回事。**
5. 如果 MetaMask 在其他网络，按网站提示切回 Sepolia。浏览器语言和钱包地址草稿只影响本机辅助设置，不替代链上权限。

### 3. 按顺序验收主要功能

| 步骤 | 使用账户与页面 | 操作与应看到的结果 |
| --- | --- | --- |
| 1 | 作者，Register / 登记作品 | 选择文件，确认文件名和指纹已显示；填写标题、简介、类别，可选填公开 HTTP(S) 参考链接，勾选声明后提交。钱包确认并上链后，发现页出现作品。 |
| 2 | 作者，Discover / 发现 | 有参考链接的作品可直接从列表打开链接；详情也可查看。原文件不上传，网站不保存封面或作品原件。 |
| 3 | 作者，My offers / 个人挂单 | 从“我的登记作品”创建挂单，设置每份价格 `0.001 ETH`、补偿 `0.0002 ETH`、期限 7 天、份数 3。总押金为 `0.0036 ETH`，另付 Gas；只需确认一笔交易。 |
| 4 | 作者，个人挂单 | 撤销其中一笔未成交挂单。该笔仍保留在历史列表，变为取消状态；`0.0012 ETH` 押金转入作者可领取余额，不是直接退到钱包。 |
| 5 | 买家，作品详情 | 换到不同钱包，打开可接受挂单的“查看条款并接单”，阅读并同意条款，支付 `0.001 ETH` 和 Gas。成交后生成独立许可；作者不能购买自己的挂单。 |
| 6 | 作者，个人挂单 | 在已签发许可中查看提前终止预览；确认后有效许可立即终止，剩余价格退款及固定补偿从已锁定押金中分配，不需要作者另行补款。 |
| 7 | 任意访问者，License lookup / 使用权查询 | 输入买家地址，可选填作品编号和历史时间，核对有效或已终止记录。读取无需连接钱包，不付 Gas；历史时间不能在未来。 |
| 8 | 作者及买家，My account / 我的账户 | 分别查看锁定押金、可领取余额；点击领取全部余额，钱包增加相应 ETH 并扣本次 Gas，可领取余额归零。 |
| 9 | 管理员，Admin / 管理台 | 录入案件编号、作品编号、证据哈希，随后提交维持或撤销结果。仅记录线下处理结果，不自动判断真实权属。 |

批量发布为整批成功或整批失败。拒签时不创建任何挂单；已提交后回执超时，点击“检查交易结果”等待同一笔交易。关闭页面不会取消已提交交易，重新发布前先查钱包或区块浏览器，避免重复。

多人可以通过同一作品的不同挂单各自取得非独占许可。一笔挂单仅成交一次；两人争同一笔时先成功的交易取得许可，后者失败且若已上链仍可能消耗 Gas。想检查筛选分页，可批量创建 10 份，作品详情每页 8 条。

### 4. 授权额外管理员

1. 当前合约 **owner** 连接网站，进入 `/dev`。
2. 先查看链上已有额外管理员，将要保留及新增的地址一起填写到输入框，每行一个公开地址。
3. 点击 **Sync on-chain administrators / 同步链上管理员**，由 owner 在 MetaMask 确认交易。
4. 上链后，新管理员切换到自己的钱包即可使用管理台，所有访问者均可读取更新后的名单。

同步是**替换额外管理员完整名单**，不是只追加输入的地址。漏掉的旧地址会被撤权，owner 本身始终保留管理权限。恢复默认只恢复浏览器草稿，不改变链上名单。额外管理员可以处理案件，但不能继续任意添加管理员；更改名单仍需 owner 签名。

### 5. 当前界面需要了解的边界

当前前端可登记、批量挂单、取消有效未成交挂单、接单、作者提前终止、查询、提现、录入及处理案件、同步管理员和给费用池注资。**尚未提供**过期/登记失效挂单退款、许可到期/登记失效结算、案件报酬拨付按钮；对应合约方法存在，但要通过脚本或合约工具单独调用。不要把“已到期”误认为“资金已自动退回钱包”。具体方法和规则见文末机制文档。

## 二、部署到 Cloudflare

仅验收已有网址可跳过本节。以下所有命令在仓库根目录运行；`--prefix contracts` / `--prefix frontend` 表示使用对应子目录的 npm 工程，不需要反复 `cd`。

### 1. 获取项目和准备 Node.js

在 GitHub 仓库的 **Code** 中复制自己的仓库地址，替换下面的 `YOUR_REPOSITORY_URL`。已有项目时只进入现有目录，不要重复克隆。

```bash
git clone YOUR_REPOSITORY_URL copyright-dapp
cd copyright-dapp
```

第一条下载源码到 `copyright-dapp` 文件夹；第二条进入项目根目录。`YOUR_REPOSITORY_URL` 是占位内容，不能原样执行。

使用 nvm 的用户执行：

```bash
nvm install
nvm use
node --version
```

`nvm install` 按 `.nvmrc` 安装 Node.js `24.15.0`；`nvm use` 切换当前终端的版本；`node --version` 检查版本。未安装 nvm 时，也可直接安装该版本 Node.js，不必使用这两条 nvm 命令。

```bash
npm ci --prefix contracts
npm ci --prefix frontend
```

两条命令分别按各自的 `package-lock.json` 安装合约与前端依赖。`npm ci` 会重新安装对应 `node_modules`，不会替你修改依赖版本，也不部署合约。

### 2. 配置部署钱包

仅首次没有 `contracts/.env` 时执行：

```bash
cp contracts/.env.example contracts/.env
```

复制配置模板。**已有 `.env` 就直接编辑，不要用此命令覆盖已经填写的配置。** 填写：

```dotenv
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
DEPLOYER_PRIVATE_KEY=0xYOUR_SEPOLIA_TEST_PRIVATE_KEY
INITIAL_ADMIN_ADDRESS=0xYOUR_INITIAL_OWNER_ADDRESS
ETHERSCAN_API_KEY=
```

| 配置 | 含义 |
| --- | --- |
| `SEPOLIA_RPC_URL` | Hardhat 访问 Sepolia 的接口；默认 PublicNode，无需 API Key，可能遇到限流。 |
| `DEPLOYER_PRIVATE_KEY` | 专用测试钱包私钥，用于本机签名部署交易；该钱包需要 Sepolia 测试 ETH。 |
| `INITIAL_ADMIN_ADDRESS` | 初始 owner 的公开地址。显式填写可避免混淆；留空时先读取 `contracts/test-accounts.json` 对应链的首个 admin，再回退到部署钱包。仓库默认 Sepolia admin 为空。 |
| `ETHERSCAN_API_KEY` | 当前部署、导出和只读检查不使用它，可以留空；这些步骤也不会自动进行 Etherscan 源码验证。 |

私钥只放在本机的 `contracts/.env`，不填入 GitHub、Cloudflare、前端配置或管理员地址框。部署脚本在本机签名，所以不弹 MetaMask；这与前端请求 MetaMask 签名是两种签名方式，都会付真实的测试网 Gas。

### 3. 检查、部署和导出

按顺序执行，某一步失败先处理，不要直接跳到后面：

```bash
npm run check:sepolia --prefix contracts
npm run build --prefix contracts
npm test --prefix contracts
npm run deploy:sepolia --prefix contracts
npm run export:sepolia --prefix contracts
npm run smoke:sepolia --prefix contracts
```

| 命令 | 功能与结果 | 是否支付 Sepolia Gas |
| --- | --- | --- |
| `check:sepolia` | 只读检查 RPC、Chain ID 和最新区块，不需要私钥。 | 否 |
| 合约 `build` | 编译 Solidity，产生本机 ABI 和字节码。 | 否 |
| 合约 `test` | 在隔离的模拟链运行测试，不操作公开 Sepolia，也不会往你手动启动的本地节点灌数据。 | 否 |
| `deploy:sepolia` | 用配置的钱包部署新 `CopyrightMarket`，等待回执，写入 `contracts/deployments/11155111.json`。 | **是** |
| `export:sepolia` | 将 ABI 和该网络部署记录导出到 `frontend/src/generated/`，保留另一网络地址。 | 否 |
| `smoke:sepolia` | 只读检查部署记录的代码、owner、条款版本与批量上限 `20`。 | 否 |

记录部署输出的 `0x...` 合约地址。**每次执行 `deploy:sepolia` 都是新的空白实例，不是升级原地址**。本地示例不会自动生成到 Sepolia。

### 4. 配置 Cloudflare Workers

已有 `workers.dev` 项目继续使用原项目，不需要重新建 Pages。首次部署时，在 Cloudflare **Workers & Pages** 创建连接 Git 仓库的 Workers 项目并选择部署分支。私有仓库可授权 Cloudflare 访问。

| 设置 | 填写值 |
| --- | --- |
| Root directory | 仓库根目录，留空或 `.` |
| Build command | `npm ci --prefix frontend && npm run build --prefix frontend` |
| Deploy command | `npx wrangler deploy` |
| 项目名 | `copyright-ark`，与 `wrangler.jsonc` 的 `name` 一致 |

构建命令先安装前端依赖，成功后再执行 TypeScript 检查和 Vite 打包；`&&` 表示前一步成功才继续。部署命令使用 Wrangler 上传构建结果。`wrangler.jsonc` 已指定只发布 `frontend/dist` 并启用 SPA 路由，不要改成上传整个仓库，也不要加 `--assets .`。无需设置 R2、D1 或运行时后端。

进入 **项目 → Settings → Build → Build variables and secrets**，添加或编辑下列普通文本构建变量。它们在 Vite 打包时使用，不是外层的运行时 Variables & Secrets。[Cloudflare 官方构建配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#build-settings)

| 变量 | 值 |
| --- | --- |
| `NODE_VERSION` | `24.15.0` |
| `VITE_DEFAULT_CHAIN_ID` | `11155111` |
| `VITE_SEPOLIA_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com`，或自己的公开可用 Sepolia RPC |
| `VITE_SEPOLIA_MARKET_ADDRESS` | 本次新部署的合约地址，不能填钱包地址或本地合约地址 |

`VITE_*` 会进入浏览器文件，都是公开配置。环境变量中的合约地址优先于 `frontend/src/generated/deployments.json`，因此仅更新导出文件而不改旧环境变量仍会连到旧合约。保存变量后必须重新构建。

### 5. 提交代码并触发构建

先本机验证前端：

```bash
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

第一条一次性运行前端自动测试并退出；不带 `--run` 会进入监听模式。第二条做 TypeScript 检查并生成 `frontend/dist`。二者都不会部署公开合约或发交易。

确认改动：

```bash
git status --short
git diff --check
```

第一条列出更改文件；第二条检查补丁空白格式。确认没有 `.env` 或其他密钥文件；公开 ABI、公开部署记录应提交。随后在检查过全部改动的前提下执行：

```bash
git add README.md README.zh-CN.md docs contracts frontend wrangler.jsonc
git commit -m "Update Copyright Ark deployment and interface"
git push
```

`git add` 暂存这些目录和文件中未被忽略的改动；`git commit` 建立本机提交；`git push` 推送当前分支（假设已配置远程跟踪分支）。确保该分支就是 Cloudflare 监听的生产分支。推送将触发 Git 集成构建；代码已推送但刚改变量时，可在构建记录选择 **Retry build**。

部署成功后访问控制台给出的 `https://<worker-name>.<account-subdomain>.workers.dev`。刷新 `/discover`、`/offers` 等子页面也应正常打开。新合约最初没有作品，按第一节重新登记并验收。

使用 Pages 也可以：根目录和构建命令相同，输出目录填 `frontend/dist`，不填 Workers 部署命令；构建环境变量在 Pages 项目设置中配置，成功后使用控制台给出的 `pages.dev` 网址。详见 [Pages 官方指南](https://developers.cloudflare.com/pages/get-started/git-integration/)。

### 6. 以后如何更新

| 改了什么 | 要做什么 |
| --- | --- |
| README、样式或普通前端逻辑 | 测试/构建后提交推送，Cloudflare 重建；不重新部署合约。 |
| Solidity，尤其新增 `createOffers` | 重新编译测试、部署、导出、更新 Cloudflare 构建合约地址并重建。旧合约不支持新增方法。 |
| Cloudflare 构建环境变量 | 保存后重试构建，单纯刷新网站无效。 |
| 管理员名单 | 当前 owner 在 `/dev` 同步上链，不需要重新构建。 |

更换合约前记录旧地址。旧作品、许可、押金、可领取余额及管理员权限留在旧合约，不会自动迁移；需要继续操作旧资金时先在旧站点处理，未到期押金仍遵守原条款。新合约的额外管理员需要重新授权。

## 三、本地运行

### 1. 下载、安装并理解两个终端

按第二节第 1 步取得仓库、准备 Node.js 并分别安装 `contracts`、`frontend` 依赖；若已经完成无需重复。**两个终端都进入同一个项目根目录。**

- 终端一始终运行 Hardhat 节点。
- 终端二先部署示例和导出接口，再运行前端并保持运行。

只是运行 `npm test` 不会启动供浏览器长期访问的节点；只是启动节点也不会自动生成作品示例。下面步骤需要按顺序执行。

### 2. 终端一：启动本地链

```bash
npm run node --prefix contracts
```

命令启动 RPC `http://127.0.0.1:8545`，Chain ID 为 `31337`。终端会打印多组测试账户的公开地址和私钥，每个账户预置大量本地测试 ETH，方便测试；这些余额不属于 Sepolia。保留该终端，不要关闭或在其中继续执行其他命令。

账户标签从 `Account #0` 开始。默认测试角色如下，脚本打印结果为最终依据：

| 角色 | Hardhat 账户 | 默认用途 |
| --- | --- | --- |
| owner / 管理员 | `#0`，第一个账户 | 管理员授权、案件处理、费用池 |
| 主要作者 | `#1`，第二个账户 | 已有 24 件示例作品、50 笔挂单 |
| 主要买家 | `#2`，第三个账户 | 已有 20 份示例许可 |
| 第二作者 | `#3`，第四个账户 | 另有 6 件作品、8 笔挂单 |
| 第二买家 | `#4`，第五个账户 | 另有 4 份许可 |

注意“第一个账户”是 `#0`，不是 `#1`。前三个角色优先读取 `contracts/test-accounts.json` 中节点实际控制的地址，否则使用相应默认账户。前端默认草稿在 `frontend/src/dev/test-accounts.json`，只保存管理员公开地址，不保存私钥。

### 3. 终端二：编译、生成示例并导出

确保节点已启动，执行：

```bash
npm run build --prefix contracts
npm run seed:local --prefix contracts
npm run export-interface --prefix contracts
```

| 命令 | 功能 |
| --- | --- |
| `build` | 编译当前 Solidity，保证部署的是当前版本。 |
| `seed:local` | 仅允许 `31337`，部署新合约，生成 30 件作品、58 笔挂单、24 份许可和 3 件案件，并校验钱包余额和合约账本。 |
| `export-interface` | 连接本地 RPC，将 ABI 和本地部署地址写入前端生成文件，保留已有 Sepolia 记录。 |

脚本不推进本地链时间。部分示例要等真实一小时才到期；作品 #1、#25、#26 有多笔可接单的不同价格/期限挂单。示例包含有效、取消、提前终止及登记撤销等状态，便于直接检查。

同一节点中再次执行 `seed:local` 会拒绝，以免覆盖当前测试入口。**不要先运行 `deploy:local` 再运行 `seed:local`**；二者都是部署流程，需要空白合约时用下面命令替代示例步骤：

```bash
npm run deploy:local --prefix contracts
npm run export-interface --prefix contracts
```

第一条只部署空合约并记录地址；第二条导出这个空合约接口。它不会包含示例作品和许可。

### 4. 配置本机前端

仅在没有 `frontend/.env` 时复制：

```bash
cp frontend/.env.example frontend/.env
```

此命令只复制配置模板；已有文件请直接编辑，避免覆盖。设置：

```dotenv
VITE_DEFAULT_CHAIN_ID=31337
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
VITE_LOCAL_MARKET_ADDRESS=
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_SEPOLIA_MARKET_ADDRESS=
```

本地地址留空会使用刚导出的本地记录。若要从本机切到 Sepolia，需已有正确的 Sepolia 导出地址，或填写 `VITE_SEPOLIA_MARKET_ADDRESS`。没有 Sepolia 部署也不影响只测本地链。修改 `.env` 后重启前端。

`VITE_DEFAULT_CHAIN_ID` 是首次使用的默认值；当前浏览器已保存的网络选择可能优先，启动后仍需在开发者菜单确认切到了本地链。

### 5. 终端二：启动前端

```bash
npm run dev --prefix frontend
```

命令启动 Vite 开发服务器，通常为 `http://127.0.0.1:5173`（以终端输出为准，端口占用时可能改变）。保留终端二运行，浏览器打开它打印的本机网址。此时两个终端都应持续运行。

### 6. MetaMask 添加 Hardhat Local 并导入账户

1. 打开 MetaMask 网络选择器，选择添加自定义网络。
2. 网络名称填写 `Hardhat Local`，RPC URL 填 `http://127.0.0.1:8545`，Chain ID 填 `31337`，货币符号填 `ETH`，区块浏览器可留空。
3. 从终端一找到 `Account #0` 对应的 `Private Key`。
4. 在 MetaMask 账户菜单选择添加/导入账户，使用**私钥导入**，粘贴该账户私钥并命名为 `Local Admin`。不要把单账户私钥当助记词导入。
5. 对 `#1`、`#2` 分别重复，命名为 `Local Author`、`Local Buyer`。需要第二作者/买家场景时再导入 `#3`、`#4`。
6. 选择 Hardhat Local，连接本机网站，在 `/dev` 选择本地链。切换钱包账户后核对网站显示的地址，必要时在 MetaMask 中允许该账户连接网站。

这些私钥是公开开发测试密钥，只能用于本地链；不要向其公开链地址存入资产。钱包地址不能随意编造来代替可签名账户。节点默认重复启动通常生成相同账户，但链上数据和 nonce 会重置。

### 7. 使用示例并切换网络

先用 `Local Author` 查看个人挂单，再用 `Local Buyer` 到发现页接单，最后用 `Local Admin` 验收管理台。其余操作与第一节验收表相同。

开发者菜单可以在本地链和 Sepolia 之间切换；发现、登记、挂单、查询、账户和管理台跟随当前业务网络读取数据，写交易需要 MetaMask 也切到相同网络。切换不会把数据复制到另一条链。本地 owner 默认是 `#0`，添加管理员也必须由该 owner 签名同步完整名单，不能任意自封管理员。

本地示例由 Hardhat 节点掌握的已解锁测试账户签名，不经过 MetaMask，所以造样例不弹钱包；手续费和金额变化依然由本地合约真实执行。前端手动操作才通过 MetaMask 请求签名。

### 8. 停止与恢复

停止前端：在终端二按 `Ctrl+C`。停止本地链：在终端一按 `Ctrl+C`。只停止前端不会清空仍在运行的节点。

两个服务都停过后，恢复方法：

1. 终端一重新执行 `npm run node --prefix contracts` 并保持运行。
2. 终端二重新执行第 3 步的编译、示例、导出命令，再执行 `npm run dev --prefix frontend`。
3. 刷新网页并核对网络及合约；地址覆盖值要留空或指向本次部署。

不需要每次重新安装依赖或重新导入相同私钥。Hardhat 内存状态在节点停止后丢失；MetaMask 若因旧 nonce 报错，只针对本地测试账户检查“清除活动和 nonce 数据”等版本对应设置，不要为此重置整个钱包。

## 四、测试命令与排错

```bash
npm test --prefix contracts
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

分别运行合约隔离测试、前端单次测试、生产构建。当前已有 10 项合约测试及 26 项前端测试；不会自动打开预览，也不替代真实 MetaMask 弹窗和 Sepolia 交易验收。

| 现象 | 检查 |
| --- | --- |
| 线上没有本地链开关 | 正常，线上固定 Sepolia；本地测试需本机运行。 |
| 本地没有示例 | 确认执行过 `seed:local`、导出接口，且 `/dev` 选择本地链。 |
| 页面读到旧数据/新方法交易失败 | 检查网络、部署地址、Cloudflare 构建地址覆盖值；更新变量后重建。 |
| 登记或挂单不弹钱包 | 确认已连接正确账户、字段有效、网络一致；余额不足或预估失败可能在发送前就被拦截。 |
| 余额不够 | 作者需要总押金加 Gas，买家需要价格加 Gas；可领取余额须先提现才是钱包余额。 |
| 许可到期但押金仍锁定 | 状态失效不等于资金结算；当前界面缺少该结算按钮，见机制文档。 |
| MetaMask 活动中没有脚本交易或到账单 | 活动列表不是完整链上账本；使用交易哈希、区块浏览器和合约余额核对。 |
| 查询漏掉大量许可 | 当前 `/verify` 最多读取该买家的前 50 份许可；不代表超出部分不存在。 |

## 五、版权管理机制与进一步阅读

登记是权利声明，不是自动确权；平台不上传原件、不自动审核侵权，也不自动交付作品。机制文档按当前代码说明权限、交易、押金、违约、案件、历史查询和界面边界：

- **[版权管理机制详解（中文）](docs/COPYRIGHT-MECHANISM.zh-CN.md)**
- [Copyright management mechanism (English)](docs/COPYRIGHT-MECHANISM.md)
- [标准许可条款 v1（中文）](docs/LICENSE-TERMS-V1.md) / [English](docs/LICENSE-TERMS-V1.en.md)
- [本地示例编号、账户和金额核验](docs/LOCAL-SAMPLES.md)
- [更详细的 Cloudflare 部署与验收参考](docs/DEPLOY-CLOUDFLARE.md)
