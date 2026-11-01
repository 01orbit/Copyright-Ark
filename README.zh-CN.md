# Copyright Ark

[English](README.md) | [简体中文](README.zh-CN.md)

面向本科 Web3 课程的简洁版权管理 DApp，支持登记文件指纹、发布非独占授权挂单、购买许可、管理押金和处理版权案件。界面默认英文，可切换中文。

登记仅记录权利声明，不代表法律上的版权确权。项目用于 Hardhat 本地链和 Sepolia 测试，不用于生产环境。

## 功能与结构

- 浏览器计算 SHA-256，原文件不上传；可登记公开的 HTTP(S) 作品参考链接。
- 一次创建 **1–20 份同配置挂单，一笔交易、一次钱包确认**；每份可独立接单或撤销。
- 作者押金为 `(价格 + 固定补偿) × 份数`，买家另付许可价格；作者提前终止许可时，从押金结算剩余价格退款及固定补偿。
- 支持挂单和许可筛选分页、历史使用权查询、可领取余额提现。
- owner 可授权管理员处理案件，案件报酬使用单独注资的费用池。

| 目录 | 用途 |
| --- | --- |
| `contracts/` | Solidity、Hardhat 3、部署脚本、本地示例和测试 |
| `frontend/` | React、TypeScript、Vite、Tailwind CSS 4、HeroUI 3、Wagmi/Viem |
| `docs/` | 规划书、许可条款、详细部署与测试指南 |

业务数据保存在 `CopyrightMarket` 合约，不需要应用后端、数据库、文件存储或 R2。前端交易由 MetaMask 签名。

## 本地版

准备 Node.js **24.15.0**（见 `.nvmrc`）、npm 和 MetaMask，所有命令在项目根目录执行。

```bash
npm ci --prefix contracts
npm ci --prefix frontend
```

**终端一：**启动本地链并保持运行。

```bash
npm run node --prefix contracts
```

**终端二：**编译、部署示例、导出前端接口。

```bash
npm run build --prefix contracts
npm run seed:local --prefix contracts
npm run export-interface --prefix contracts
```

脚本生成 30 件作品、58 笔挂单、24 份许可和 3 件案件，名称与简介为英文，不推进链上时间。需要空白合约时，把 `seed:local` 换成 `deploy:local`。

参照示例创建或编辑 `frontend/.env`：

```dotenv
VITE_DEFAULT_CHAIN_ID=31337
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
VITE_LOCAL_MARKET_ADDRESS=
VITE_SEPOLIA_MARKET_ADDRESS=
```

地址留空时使用 `frontend/src/generated/deployments.json`；重新部署后清除旧地址覆盖值。启动前端：

```bash
npm run dev --prefix frontend
```

打开 Vite 输出的网址。在 MetaMask 添加 RPC `http://127.0.0.1:8545`、Chain ID `31337`、货币符号 `ETH`，导入 Hardhat 测试账户。这些公开私钥只能用于本地链。开发者菜单允许本机前端在 Hardhat 与 Sepolia 间切换。

在各自终端按 `Ctrl+C` 停止服务。Hardhat 停止后，内存中的链上数据会丢失；重启节点，再执行示例和导出命令，刷新前端即可。

## Cloudflare / Sepolia 版

Cloudflare 托管静态前端，不运行 Hardhat。线上网址（包括自定义域名）**固定使用 Sepolia**。

1. 参照示例创建 `contracts/.env`。`DEPLOYER_PRIVATE_KEY` 填专用 Sepolia 测试钱包私钥，部署钱包需有测试 ETH；`INITIAL_ADMIN_ADDRESS` 填初始 owner 的公开地址。默认使用 PublicNode RPC，部署不要求填写 `ETHERSCAN_API_KEY`。
2. 依次执行：

   ```bash
   npm run build --prefix contracts
   npm test --prefix contracts
   npm run deploy:sepolia --prefix contracts
   npm run export:sepolia --prefix contracts
   npm run smoke:sepolia --prefix contracts
   ```

3. 提交源码、`contracts/deployments/11155111.json` 和 `frontend/src/generated/`，不要提交 `.env`、私钥或助记词。
4. Cloudflare 连接仓库，设置如下：

   | 设置 | Workers | Pages |
   | --- | --- | --- |
   | 根目录 | 仓库根目录 | 仓库根目录 |
   | 构建命令 | `npm ci --prefix frontend && npm run build --prefix frontend` | 相同 |
   | 部署命令 | `npx wrangler deploy` | 不需要 |
   | 静态输出 | 已在 `wrangler.jsonc` 指定 `frontend/dist` | `frontend/dist` |

5. 设置**构建环境变量**：`NODE_VERSION=24.15.0`、`VITE_DEFAULT_CHAIN_ID=11155111`、`VITE_SEPOLIA_MARKET_ADDRESS=<新 Sepolia 地址>`，需要时设置 `VITE_SEPOLIA_RPC_URL`。保存后重新构建；只改运行时变量不会改变已经打包的前端。Cloudflare 和 `VITE_*` 变量中不要放私钥。
6. 打开部署网址，MetaMask 切到 Sepolia（`11155111`）。作者登记作品、一次确认创建三份挂单，再换买家钱包接单，检查提前终止、押金和提现。增加管理员需由 owner 在 `/dev` 签名同步。

**更新已有站点：**本次新增 `createOffers`，旧合约不支持。需重新部署、导出接口、更新 Cloudflare 合约地址并重新构建。环境变量地址优先于导出记录。新合约初始为空，旧作品、余额和权限留在旧地址，不会自动迁移；切换前记录旧地址并处理仍需领取的款项。额外管理员也要在新合约重新授权。Sepolia 不会自动生成本地示例。

## 检查与详细指南

```bash
npm test --prefix contracts
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

当前有 10 项合约测试、26 项前端测试；真实 MetaMask 弹窗和 Sepolia 交易仍需手动验收。

- [Cloudflare 部署与逐步骤测试](docs/DEPLOY-CLOUDFLARE.md)
- [本地示例账户与测试场景](docs/LOCAL-SAMPLES.md)
- [Cloudflare Workers 构建配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
