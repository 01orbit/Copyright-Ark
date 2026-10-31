# 共享作品封面：本地测试与 Cloudflare 部署

第一次完整部署课设请先看 [Cloudflare 首次部署教程](DEPLOY-CLOUDFLARE.md)，其中包含 Sepolia 合约、GitHub、R2/Worker、Pages 和在线验收步骤；本文补充封面实现与本地测试细节。

封面不写入合约，不增加登记的 Gas，也不需要重新部署合约。浏览器生成缩略图，Cloudflare Worker 验证上传请求，再保存到 R2；其他访问者通过同一个 Worker 读取。原文件始终留在访问者电脑上。

## 支持哪些文件

| 原文件 | 生成的封面 |
| --- | --- |
| PNG / JPG / JPEG / WebP | 等比例图片缩略图 |
| PDF | 第一页 |
| TXT | 开头文字排版 |
| MP4 | 开头约一秒处的画面，短视频取中间画面 |
| MP3 / WAV | 实际音频波形、文件名和时长 |

缩略图统一为 WebP，最长边不超过 960px，最大 192 KiB。音视频需要浏览器支持相应编码；加密、损坏或无法解码的文件可能生成失败。当前不支持 Word、PPT 等 Office 格式。没有封面、服务未配置或读取失败时，保留小尺寸类型图标。

登记页选择文件后会显示封面预览。登记成功会进入作品详情，点击“发布封面 / 重试”，由 MetaMask 签署一条消息后上传，**这不是链上交易**。上传失败不会撤销登记，也不必重新交 Gas。已有作品的登记人也可以在详情页重新选择原文件，前端核对 SHA-256 后生成并发布封面。刷新会丢失未上传的内存草稿，重新选择原文件即可。

生成的封面会公开展示，包括文档首页的文字。发布前请检查预览是否包含不希望公开的信息。封面不是链上版权证明；首次上传后不允许覆盖，以便公开缓存和安全重试。

## 先在本机验证，无需 Cloudflare 账户

以下命令在项目根目录执行。已有本地链和已部署合约时，沿用它们即可；节点重启后需重新部署。启动链和部署的方法见 README。

首次安装封面服务：

```bash
npm ci --prefix cover-worker
cp cover-worker/.dev.vars.example cover-worker/.dev.vars
```

编辑 `cover-worker/.dev.vars`，保留 `ENABLE_LOCAL_UPLOADS=true`，将 `LOCAL_UPLOAD_TOKEN` 换成自己设置的测试口令。该文件已加入忽略规则，不要提交 GitHub。它与钱包私钥没有关系。

在一个终端运行封面服务：

```bash
npm run dev --prefix cover-worker
```

在 `frontend/.env` 中加入：

```dotenv
VITE_COVER_API_URL=http://127.0.0.1:8787
```

重新启动前端：

```bash
npm run dev --prefix frontend
```

进入开发者菜单，切换到本地链，将上面的 `LOCAL_UPLOAD_TOKEN` 填入“本地封面上传口令”，点击保存。口令仅保存在当前标签页的 `sessionStorage`，不写入默认配置、不会随前端构建发布；新标签页需要重新填写。按前述流程登记并发布封面后，用另一标签页打开发现页，即可检查共享读取，无需连接钱包也能看封面。

此时封面存放于 `cover-worker/.wrangler/state/` 下的本地 R2 模拟存储，不会上传 Cloudflare；停止服务后文件仍在，但外部电脑不能访问本机的 `127.0.0.1`。终端按 `Ctrl+C` 停止对应服务。

## 部署 Worker 与 R2

先在 Cloudflare 准备可用的 R2 账户。在 `cover-worker` 目录登录并创建桶：

```bash
cd cover-worker
npx wrangler login
npx wrangler r2 bucket create copyright-ark-covers
```

编辑 `cover-worker/wrangler.jsonc`（这里已经在该目录，文件名就是 `wrangler.jsonc`）：

- `r2_buckets[0].bucket_name`：上一步创建的桶名。
- `ALLOWED_ORIGINS`：允许上传的网站来源，例如 `https://copyright-ark.pages.dev`。多个来源用英文逗号分隔；不要加路径或末尾斜杠。预览部署域名需要单独加入。
- `SEPOLIA_MARKET_ADDRESS`：实际部署的 Sepolia `CopyrightMarket` 地址，须与前端使用的地址相同。空值会禁止 Sepolia 上传。
- `SEPOLIA_RPC_URL`：默认 PublicNode，可替换为你自己的 Sepolia RPC；带私密 API Key 的地址应使用 `npx wrangler secret put SEPOLIA_RPC_URL` 保存，并移除同名明文变量。
- `ENABLE_LOCAL_UPLOADS`：默认 `false`。只测 Sepolia 时保持此值。

如果部署后仍要测试本地链封面，将 `ENABLE_LOCAL_UPLOADS` 改为 `true`，并设置独立口令：

```bash
npx wrangler secret put LOCAL_UPLOAD_TOKEN
```

按提示输入自行生成的长随机口令，例如可用 `openssl rand -hex 24` 生成。仅将该测试口令分享给助教，助教在开发者菜单填写；**不要放入任何 `VITE_*` 变量**。本地链上传权限是演示用途，持有该口令的人可以发布本地链分区中的封面。测试结束后关闭 `ENABLE_LOCAL_UPLOADS` 并重新部署。

最后执行：

```bash
npm run deploy
```

记下输出的 Worker HTTPS 地址。R2 桶无需启用公开 `r2.dev` 地址或额外设置桶 CORS，所有读取、上传及 CORS 都由 Worker 处理。R2 和 Workers 的额度、计费以账户显示为准。

## 在 Cloudflare Pages 发布前端

连接 GitHub 仓库，设置：

| 设置 | 值 |
| --- | --- |
| Root directory | 留空，使用仓库根目录 |
| Build command | `npm ci --prefix frontend && npm run build --prefix frontend` |
| Build output directory | `frontend/dist` |
| `NODE_VERSION` | `24.15.0`（与项目 `.nvmrc` 一致） |
| `VITE_COVER_API_URL` | 上一步 Worker 的 HTTPS 地址，不加末尾斜杠 |
| `VITE_DEFAULT_CHAIN_ID` | `11155111` |
| `VITE_SEPOLIA_MARKET_ADDRESS` | 实际部署的 Sepolia 合约地址 |
| `VITE_SEPOLIA_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` 或其他公开 RPC |
| `VITE_LOCAL_RPC_URL` | `http://127.0.0.1:8545` |
| `VITE_LOCAL_MARKET_ADDRESS` | 课堂本地部署使用的合约地址 |

先部署合约并导出 ABI/地址，将 `frontend/src/generated/` 提交到仓库，再构建前端。`shared/` 也必须提交，浏览器与 Worker 共用其中的上传协议。`public/_redirects` 已处理前端路由，直接刷新作品详情等页面也可访问。

获得 Pages 域名后，将它加入 Worker 的 `ALLOWED_ORIGINS` 并重新部署 Worker。更换 `VITE_*` 变量后需要重新构建 Pages。不要把部署钱包私钥、助记词、Cloudflare API Token 或本地上传口令填入前端环境变量。

## 本地链与 Sepolia 如何隔离

封面对象按以下路径保存：

```text
covers/链ID/合约地址/链批次/作品ID/文件SHA256.webp
```

Sepolia 的链批次固定为 `sepolia`；本地链使用创世区块哈希区分重启批次。切换业务网络时，前端同时切换 RPC、合约、作品和封面地址。不同合约、不同链批次或不同文件指纹不会共用封面。

Sepolia 上传时，Worker 验证签名有效期、签名者、封面字节摘要、目标地址，再通过 RPC 核对 `getWork` 返回的登记人与文件指纹。只允许配置的合约。普通访客可以公开读，不能上传别人的作品封面。

Cloudflare 无法连接访问者电脑的 Hardhat，因此本地链采用“有效钱包签名＋独立测试口令”，**云端不声称验证过本地链权属**。浏览器中的本地业务仍经本机 RPC 读取、经 MetaMask 签交易。不同电脑要测试同一份本地链数据，必须连接同一个可访问的 Hardhat 节点；各自的 `localhost` 代表各自电脑。

从 HTTPS 的 Pages 访问本机 HTTP RPC，浏览器可能要求允许本地网络访问；这也取决于浏览器及 MetaMask 环境。需要在浏览器实际允许该访问，或直接用本地前端检验 Hardhat。Worker 从不代连本机 RPC。

## 检查命令与本次验证边界

项目根目录执行：

```bash
npm test --prefix cover-worker
npm run build --prefix cover-worker
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

Worker 的 `build` 只检查 TypeScript 并执行部署打包预检，不发布资源。测试覆盖签名篡改/过期、文件大小、类型、上传口令、跨来源、链/合约/批次隔离、首次写入保护，以及模拟 Sepolia RPC 的登记人检查。

本次还在实际 Hardhat 节点和 Wrangler 本地 R2 中完成登记、钱包消息签名、上传、匿名读取、重复上传与错误口令检验；浏览器检查了图片、PDF 首页、TXT、MP3/WAV、MP4 封面，以及发现页和详情页读取。没有替你登录或创建 Cloudflare 云端资源，也没有使用真实 MetaMask 扩展完成 Sepolia 上传；这两项需部署配置后实测。

参考：[Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/get-started/workers-api/)、[Wrangler 配置](https://developers.cloudflare.com/workers/wrangler/configuration/)、[Pages 构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)、[Pages 路由重写](https://developers.cloudflare.com/pages/configuration/redirects/)、[PDF.js 示例](https://mozilla.github.io/pdf.js/examples/)、[浏览器本地网络访问](https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access)。
