# Copyright Ark · Copyright Management DApp

这是一个适合本科 Web3 入门课的版权管理 DApp：用户在本地计算作品文件的 SHA-256 指纹并登记权利声明；登记人可以发布有期限的使用许可，并在挂单时锁定 `价格 + 固定补偿` 的押金。如果作者提前撤销，合约按剩余期限把退款和补偿记入买家余额；管理员依线下案件撤销登记时，尚未终止的许可押金全部给买家。

> 本平台记录权利声明与授权，不自动审核真实权属。登记不是现实版权确权。

## 项目结构

- `contracts/`：Hardhat 3 + Solidity 0.8.28 + OpenZeppelin 5 合约工程。
- `frontend/`：Vite + React + TypeScript + Wagmi/Viem，使用 Tailwind CSS 4 + HeroUI 3。
- `docs/`：规划书、标准许可条款和交付说明。

Node 基线写在 `.nvmrc`（当前验证版本：Node 24.15.0）。合约与前端独立构建，前端只读取 `src/generated/` 中导出的 ABI。

准备让助教直接通过网址测试时，按 [Cloudflare 首次部署教程](docs/DEPLOY-CLOUDFLARE.md) 操作；先在本机测试本地链，再部署 Pages 验收 Sepolia。线上版本固定 Sepolia，本机前端才允许切换本地链与 Sepolia。

## 本地链快速运行

```bash
# 终端 1：安装并启动本地链
npm ci --prefix contracts
npm run node --prefix contracts

# 终端 2：编译、测试、部署
npm run build --prefix contracts
npm test --prefix contracts
npm run deploy:local --prefix contracts
npm run export-interface --prefix contracts
```

把部署脚本输出的合约地址填入 `frontend/.env`：

```dotenv
VITE_DEFAULT_CHAIN_ID=31337
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
VITE_LOCAL_MARKET_ADDRESS=部署输出的0x地址
VITE_SEPOLIA_MARKET_ADDRESS=
```

然后启动前端：

```bash
npm ci --prefix frontend
npm run dev --prefix frontend
```

MetaMask 添加网络：RPC `http://127.0.0.1:8545`，Chain ID `31337`，货币符号 `ETH`。只使用 Hardhat 输出的本地测试账户；这些私钥不能用于 Sepolia 或主网。可以用 `npm run seed:local --prefix contracts` 代替空合约部署，生成 30 件作品、58 笔不同状态的挂单、24 份许可和 3 件案件，其中作品 #1、#25、#26 各有三种常规可接受挂单。然后执行 `npm run export-interface --prefix contracts`；本地合约地址覆盖值留空即可使用导出地址。脚本只允许在本地链运行，同一节点上重复执行会拒绝；不修改链上时间，短期示例按真实时间等待到期。账户、样例编号和验证方法见 [本地样例测试指南](docs/LOCAL-SAMPLES.md)。

## Sepolia 测试网（PublicNode，无需 Remix）

Hardhat 和前端已默认使用 [PublicNode 的免费 Sepolia HTTP RPC](https://ethereum.publicnode.com/?sepolia)：`https://ethereum-sepolia-rpc.publicnode.com`。无需注册或 API Key，也不需要额外安装 SDK。公共 RPC 可能限流或暂时不可用；可以通过下面的环境变量替换服务商。

所有 `npm` 命令都在项目根目录执行。先运行只读连接检查；不需要私钥或测试币，也不会部署合约：

```bash
npm run check:sepolia --prefix contracts
```

检查成功会打印 Chain ID `11155111` 和最新区块号。若失败，检查网络连接，或在 `contracts/.env` 设置其他 Sepolia RPC 后重试。

### 1. 准备测试部署钱包

将 `contracts/.env.example` 复制为 `contracts/.env`（已有文件就直接编辑），填写持有 Sepolia 测试 ETH 的独立测试钱包：

```dotenv
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
DEPLOYER_PRIVATE_KEY=0x你的专用测试钱包私钥
INITIAL_ADMIN_ADDRESS=0x你的MetaMask测试钱包地址
```

`INITIAL_ADMIN_ADDRESS` 可留空，默认由部署钱包担任管理员。私钥只存放于本机 `contracts/.env`，不要发送给他人，也不要写进前端 `VITE_*` 配置。不要使用 Hardhat 的公开本地私钥部署到 Sepolia。PublicNode 免费提供 RPC 访问，部署和写交易仍然需要测试 ETH 支付 Gas。

### 2. 编译、部署、导出地址

```bash
npm run build --prefix contracts
npm run deploy:sepolia --prefix contracts
npm run export:sepolia --prefix contracts
npm run smoke:sepolia --prefix contracts
```

部署脚本等待真实交易回执，再将合约地址、交易哈希、部署区块和代码指纹写入 `contracts/deployments/11155111.json`，并打印 Sepolia Etherscan 链接。每次执行部署命令都会创建新的合约实例，测试 ETH 消耗取决于网络 Gas。

`export:sepolia` 把 ABI 和部署地址导出至前端，同时保留已有本地链地址。`smoke:sepolia` 只读检查合约代码、管理员和条款版本，不发送收费交易。

### 3. 启动前端并连接 MetaMask

将 `frontend/.env.example` 复制为 `frontend/.env`（已有文件就直接编辑），设置：

```dotenv
VITE_DEFAULT_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_SEPOLIA_MARKET_ADDRESS=
```

执行过 `export:sepolia` 后，合约地址可以留空，前端会读取导出记录；也可以在 `VITE_SEPOLIA_MARKET_ADDRESS` 填写真实地址来覆盖记录。修改 `.env` 后重新启动前端：

```bash
npm run dev --prefix frontend
```

使用安装了 MetaMask 扩展的浏览器打开本地网页，连接测试钱包并切换到 Sepolia。换用作者、买家等不同账户测试登记、挂单、接受许可和提现。需要测试管理员案件报酬时，在管理台单独给费用池注资；部署不会自动注资。

完成部署并执行地址导出后，前端可继续运行在本机，合约和交易实际存在于 Sepolia，不需要启动 Hardhat 本地节点。当前前端默认使用 `11155111`（Sepolia）；本地开发仍可在 `.env` 中将 `VITE_DEFAULT_CHAIN_ID` 改为 `31337`，并填写本地合约地址后重启。若要发布前端，运行 `npm run build --prefix frontend` 后托管 `frontend/dist/`。

## 前端页面

界面使用 Tailwind CSS 4 + HeroUI 3，采用灰白与蓝色点缀。按钮、卡片、标签、输入框、下拉框、复选框、折叠条款和弹窗统一使用 HeroUI 组件；`src/components/ui.tsx` 提供少量共享表单包装，页面里仍然就地保留字段含义和布局。布局和间距直接写 Tailwind 类，不另建样式系统。

前端阅读顺序：`src/App.tsx` 查看路由，`src/pages/` 查看各页；`src/components/` 复用导航、表单外壳和挂单组件；`src/market.tsx` 集中处理合约类型、网络选择与交易确认。`src/styles.css` 仅保留库的导入、主题变量和少量基础控件样式。作品列表使用紧凑的文字卡片；登记人可以填写可选 HTTP(S) 参考链接，链接作为公开字段写入合约。平台不保存或展示作品封面，也不保存原始作品文件。

- `/`：独立首页，仅显示项目介绍和“进入”按钮，不显示导航和页脚。
- `/discover`：最新作品、标题搜索、类别筛选和已撤销开关；业务页面左上角 Logo 返回首页。
- `/register`：本地文件格式/大小/UTF-8 字节检查、SHA-256 指纹、登记交易。
- `/works/:id`：作品详情、可用挂单筛选与分页、接受许可及历史记录。
- `/offers`：个人挂单、批量创建、撤销挂单及提前终止许可。
- `/verify`：无需连接钱包即可按地址和 Work ID 查询许可，可指定历史时间。
- `/account`：可领取余额、锁定押金和提现。
- `/admin`：管理员录入案件、提交维持/撤销结果，并可注资独立费用池。
- `/dev`：开发者菜单，可从顶栏进入；任意页面按 `Alt + Shift + D` 也可打开。菜单中的业务网络开关会同步切换所有页面的 RPC、合约地址、链上读取和交易目标；连接钱包时会同时请求 MetaMask 切换网络。

页面右上角提供“EN / 中”语言切换，首次进入默认使用英文。首页和所有业务页面的导航、表单、状态提示、许可条款与开发者菜单都支持中文和英文；选择保存在当前浏览器，刷新页面后继续使用。作品标题、简介和测试地址等用户输入不会因为切换语言而丢失。

作者创建挂单时可输入 1–20 份，批量生成同配置的独立挂单。每份分别锁定押金并请求 MetaMask 确认；中断后可继续剩余份数。作品详情的可接受挂单支持价格、期限及搜索组合筛选，每页 8 条。

### 链上数据边界

作品登记、作品标题与简介、参考链接、文件哈希、授权挂单、许可记录、案件处理、余额和提现都由 `CopyrightMarket` 合约保存或执行；前端通过当前网络的 RPC 读取，交易由 MetaMask 签名。参考链接和作品元数据都是公开的链上数据，不要填写私人地址或访问令牌。原始作品文件只在浏览器中计算 SHA-256，不上传也不写入合约。语言选择和开发者菜单中的测试地址属于浏览器辅助配置，不是业务数据。

### 开发者测试菜单

默认测试地址放在 `frontend/src/dev/test-accounts.json`，按本地链（`31337`）和 Sepolia（`11155111`）分别配置管理员、作者和买家地址。每个角色都是地址数组，可以填写多个钱包；本地链预填 Hardhat 公开演示地址，Sepolia 默认留空。配置文件只保存钱包**公开地址**，不保存私钥或助记词。

合约脚本使用 `contracts/test-accounts.json` 读取同样的多地址结构。部署脚本在没有设置 `INITIAL_ADMIN_ADDRESS` 时使用管理员数组的第一个地址作为初始 owner；本地样例脚本会从配置中选择能在当前 Hardhat 节点找到的第一个管理员和作者地址，其他地址仍可用于前端逐个切换 MetaMask 测试。地址配置只是测试提示，不会给任何钱包授予链上权限。

助教打开 `/dev` 后，选择网络、在每个角色的文本框中按行填写一个或多个地址，再点击“保存覆盖配置”，就能覆盖当前浏览器使用的默认值；刷新后仍然保留，点击“恢复默认”可清除该网络的覆盖。旧版单地址配置也会自动读取并转换为数组。覆盖保存在当前网站的 `localStorage` 中，不会修改仓库文件，也不会上传服务器。因此部署到 Cloudflare 后，每位测试者可以使用自己的地址；不同浏览器、不同网站域名之间不会共享覆盖配置。

菜单可核对连接钱包是否匹配测试角色，读取链上真实管理员，并跳转到预填地址的许可查询。地址配置仅辅助测试：填写某个管理员地址不会授予权限，实际操作仍需 MetaMask 控制相应账户并由合约验证；要变更链上管理员，需要走合约自身的管理员转移流程。

## 验证记录

已在本环境完成：

- `npm run build --prefix contracts`：Solidity 编译通过，启用 IR 优化后部署字节码低于 EIP-170 限制。
- `npm test --prefix contracts`：登记、参考链接校验、押金挂单、接受、作者提前撤销分账、案件费用池隔离，共 6 个测试通过。
- `npm run build --prefix frontend`：TypeScript 检查和 Vite 生产构建通过。
- `npm test --prefix frontend -- --run`：共 25 项测试通过，覆盖批量发布与中断恢复、挂单筛选分页、网络策略、英文默认语言及业务校验。
- PublicNode Sepolia 只读检查成功（2026-10-30，Chain ID `11155111`）；隔离本地链验证部署回执、地址导出保留其他网络、缺少私钥时拒绝部署均通过。
- Hardhat 本地节点真实部署和前端样例联调已成功；本地地址由每次部署脚本输出（本地节点重启后会变化，不能用于 Sepolia）。

浏览器扩展签名、Sepolia 真实部署和测试 ETH 依赖你自己的 MetaMask 与 RPC 配置，未在没有授权账户的情况下伪造为已完成。
