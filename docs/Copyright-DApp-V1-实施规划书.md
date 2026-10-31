# 版权声明与押金担保授权 DApp：第一版实施规划书

版本：1.0  
规划日期：2026-10-27  
适用范围：本科 Web3 入门课单次作业；本地开发、自动化测试、MetaMask 操作、Sepolia 演示。  
文档性质：产品需求、业务规则、合约接口约定、前端要求和验收依据的合并规格。本文规定的是待实现系统，不代表代码已经完成。

## 0. 给实施 agent 的说明

请按本文直接生成可以运行的第一版项目，而不是只生成脚手架、静态页面或带大量 TODO 的样例。

- 本文中的“必须”属于第一版验收范围；“不做”属于明确的范围限制。
- 业务规则以本文为准。实现过程中可调整内部文件组织、组件拆分和非业务性的代码写法；不能悄悄改变赔偿公式、权限、资金来源、查询语义和结算边界。
- 开始编码前先检查工作目录、已有代码、AGENTS.md、Node 和依赖。已有用户文件不得被初始化命令覆盖。
- 优先完成合约和测试，再做前端联调；前端可并行做纯展示组件，但不能自行假定另一套业务状态。
- 用户不熟悉 React，实施 agent 应包办前端实现、交互、错误处理和联调。README 必须面向没有 React 经验的使用者。
- 所有业务页面、错误提示和操作说明使用简体中文。代码标识符使用英文。
- 没有外部服务密钥也必须能完整运行本地版本。Sepolia 缺少 RPC 或部署账户时，交付配置模板和部署步骤，明确记录未实际完成的验证，不伪造部署地址。
- 不需要再询问本文已经明确的实现选择。发现真正无法兼容的依赖时，选用同主版本内兼容版本，记录原因并重新验证。

## 1. 项目目标与范围

### 1.1 一句话定义

这是一个记录作品权利声明、出售有期限的使用许可，并通过登记人押金保证提前撤销赔偿的 DApp。

核心特色是：**登记人能提前结束自己出售的许可，但必须按照预先约定向买家退款并支付固定补偿，赔付资金在挂单时就已锁定。**

这是对现有登记、授权、担保和补偿机制的组合应用，不宣称世界首创。

### 1.2 第一版必须提供

1. 作品登记、文件指纹去重、违规登记撤销、更正登记关联。
2. 管理员录入线下案件、提交处理结果、领取固定手续费补贴和处理报酬。
3. 报价、挂单、接受、取消、过期退款、作者提前撤销、押金结算、账户提现。
4. 按钱包地址、作品和时间查询平台许可记录，支持历史查询。
5. Discover：最新作品、热门作品、标题搜索、类别筛选。
6. 登记文件和字段的自动格式检查，不使用大模型。
7. 本地测试链完整演示；支持切换到 Sepolia，提供部署与前端配置流程。

### 1.3 第一版明确不做

不做真实版权确权、自动侵权识别、内容相似度查重、在线审判、DAO 投票、多人仲裁、多签集成、申诉系统、NFT、平台代币、ERC-20 支付、拍卖、议价聊天、版权所有权转让、独占许可、转授权、许可转卖、版税分账、链下全文存储平台、加密文件交付、DRM、AI 推荐、独立索引后端、数据库和生产级反作弊。

不把“上线以太坊主网”列入交付。不自动花费真实 ETH 或购买服务。

### 1.4 必须正确使用的表述

- “首个登记者”是平台默认认可的**权利声明人**，不是由合约证明的真实版权所有人。
- 管理员撤销的是**平台上的权利声明**，不能写成管理员剥夺现实版权。
- 查询结果是“平台许可记录在指定时间是否有效”，不能写成链上系统证明某次现实使用合法。
- 前端首页用一句话说明：“本平台记录权利声明与授权，不自动审核真实权属。”不需要反复弹窗。

这一界限与现实中版权通常不依赖登记自动产生的情况一致，参见 [WIPO 版权问答](https://www.wipo.int/en/web/copyright/faq-copyright)。

## 2. 技术与架构决策

### 2.1 固定技术组合

| 部分 | 选择 | 作用 |
| --- | --- | --- |
| 合约 | Solidity + OpenZeppelin Contracts 5 | 权限、登记、许可与资金结算 |
| 合约工程 | Hardhat 3 + Viem toolbox + TypeScript | 编译、本地链、测试、部署脚本 |
| 合约测试 | Node.js test runner + Viem + Hardhat helpers | 多账户、时间推进、余额和状态测试 |
| 前端 | React + TypeScript + Vite | 单页应用，可静态部署 |
| 钱包接入 | Wagmi + 浏览器 injected connector | 连接 MetaMask，切换账户和网络 |
| 链交互 | Viem | 编解码、读取、模拟、交易回执、金额工具 |
| 异步数据 | TanStack Query | 查询、缓存、失效和刷新 |
| 前端路由 | React Router 或等价轻量客户端路由 | 页面切换，支持静态托管回退 |
| 样式 | 普通 CSS/CSS Modules，使用一套设计变量 | 控制依赖和维护成本 |
| 测试补充 | Vitest；Playwright 浏览器烟测 | 前端业务计算与页面集成验证 |

不混入 ethers.js；不使用 Scaffold-ETH 等带有大量项目约定的一体化框架。Hardhat 官方支持 TypeScript/Viem 测试，[官方测试说明](https://hardhat.org/docs/guides/testing)。Wagmi 负责 React 中的钱包与链数据接入，并与 Viem、TanStack Query 配合，[官方入门文档](https://wagmi.sh/react/getting-started)。

### 2.2 版本基线

以下版本于规划日从 npm registry 查询，仅作为可复现的起点，不要求未来永远追随 latest：

| 包 | 起始版本 |
| --- | --- |
| wagmi | 3.7.9 |
| viem | 2.57.12 |
| @tanstack/react-query | 5.105.0 |
| react | 19.3.1 |
| vite | 8.3.5 |
| hardhat | 3.21.1 |
| @nomicfoundation/hardhat-toolbox-viem | 5.0.7 |
| @openzeppelin/contracts | 5.6.1 |

实施要求：

- Node 使用维护中的 Node 24；记录实际 `node --version`，写入 `.nvmrc` 或等价版本文件。Hardhat 3 官方最低起点是 Node 22.13.0，不能直接套用 Hardhat 2 的旧环境说明，[Node 支持说明](https://hardhat.org/docs/reference/nodejs-support)。
- TypeScript 至少满足所选 Wagmi 的 peer dependency；上述 Wagmi 版本要求 TypeScript >= 5.9.3。实际选择安装时兼容的稳定版本并锁定。
- React DOM 与 React 保持相同版本；相关类型包、Vite React 插件、测试工具选择兼容版本。
- 使用 npm，提交各工程的 `package-lock.json`，后续通过 `npm ci` 安装。避免 `--force`、`--legacy-peer-deps` 掩盖冲突。
- 前端代码按 Wagmi 3 文档编写，不能照搬 Wagmi 1/2 的过时 API；将钱包 hook 封装在基础设施层。
- Solidity 初始固定 0.8.28、optimizer enabled、runs 200、EVM target Cancun。若所选 OpenZeppelin 的 pragma 要求更高编译器，可统一升到兼容的稳定编译器并记录，不能只修改某一个文件。
- 不使用代理升级。合约使用普通 `ReentrancyGuard`，不依赖 transient 版本。

### 2.3 低耦合边界

采用三个独立目录：

```text
contracts/     独立 npm 工程：Solidity、测试、部署、ABI 导出
frontend/      独立 npm 工程：React 应用，拥有导出的接口文件副本
docs/          实施后的使用说明、业务规则、部署记录
```

链上第一版部署一个 `CopyrightMarket` 合约，内部按登记、交易、案件三个职责组织代码。**工程独立不等于必须部署多个相互调用的合约。** 单合约能让结算保持原子性，也减少课堂作业的部署负担。

前端只能依赖：导出的 ABI、部署描述、只读 RPC 和钱包。禁止从 `contracts/node_modules`、Hardhat runtime、测试 fixture 或 Solidity 源目录导入运行时代码。

接口导出是显式操作；前端目录复制到另一个位置并独立 `npm ci && npm run build` 后仍能构建。将来换前端框架或测试框架，不改合约业务规则。

## 3. 统一术语、单位与默认参数

### 3.1 名词

| 名词 | 定义 |
| --- | --- |
| Work | 一次作品权利声明，有独立 workId |
| fileHash | 原始文件字节的 SHA-256，bytes32，不能用文件名代替 |
| Registrant / Seller | Work 的登记钱包，也是该声明下许可的卖家 |
| Offer | 一张固定条款、只能成交一次的挂单 |
| License | Offer 被接受后产生的一份许可 |
| Licensee / Buyer | 接受 Offer 并付款的钱包 |
| Case | 管理员录入的一个线下处理案件 |
| Claimable balance | 用户已经可以领取、但尚未提到钱包的余额 |
| Reward pool | 只用于管理员案件补贴与报酬的独立资金账目 |

“某个人”在代码中一律抽象成钱包地址；不提供实名映射。

### 3.2 金额与时间

- 支付和押金只使用当前链的原生 ETH；Sepolia 上是测试 ETH。
- 所有链上金额为 `uint256` wei，所有前端业务计算为 `bigint`。不能用 JavaScript `number`、`parseFloat` 计算钱。
- 用户输入 ETH 字符串，用 `parseEther` 或 `parseUnits(..., 18)` 解析，最多 18 位小数。展示用 `formatEther`。
- 交易和结算不包含用户付给网络的 Gas。例子中的金额只是演示参数，不是汇率或现实收费建议。
- 链上时间为 UTC Unix 秒，建议存储 `uint64`；前端输入本地时间后转换，并同时展示时区或 UTC 值。
- 许可使用半开区间 `[startsAt, endsAt)`；恰好到 `endsAt` 就失效。
- 挂单只在 `block.timestamp < acceptUntil` 时可接受；等于截止时间即不可接受。

### 3.3 合约约束与演示默认值

| 项目 | 合约约束 | 前端默认值 |
| --- | --- | --- |
| 许可价格 P | 1 wei 至 1 ETH | 0.001 ETH |
| 固定补偿 C | 1 wei 至 1 ETH | 0.0002 ETH |
| 挂单押金 D | 严格等于 P + C | 只读计算，不让用户另填 |
| 许可期限 T | 60 秒至 365 天 | 7 天 |
| 接受截止时间 | 创建时未来 60 秒至 30 天 | 24 小时后 |
| 合约分页大小 | 1 至 50 条 | 20 条 |
| 本地文件大小 | 浏览器限制大于 0 且不超过 20 MiB | 无默认文件 |
| 案件 Gas 固定补贴 | 构造时设置，第一版不可修改 | 0.0001 ETH |
| 案件处理报酬 | 构造时设置，第一版不可修改 | 0.00005 ETH |
| 本地费用池初始注资 | 部署后单独调用注资 | 0.01 ETH |

价格上限和时间上限是课堂演示的范围控制，不是市场定价算法。没有自动判断“合理价格”；买家在签名前看到全部成本和赔偿条款，自主接受。

## 4. 角色和权限

| 行为 | 未连接钱包 | 普通地址 | 本作品登记人 | 管理员 |
| --- | --- | --- | --- | --- |
| 浏览、搜索、历史查询 | 可以 | 可以 | 可以 | 可以 |
| 登记作品 | 不可以 | 可以 | 可以 | 可以 |
| 本作品挂单、取消、撤销许可 | 不可以 | 不可以 | 可以 | 仅当自己也是登记人 |
| 接受挂单 | 不可以 | 可以 | 禁止购买自己的挂单 | 可以购买他人挂单 |
| 触发到期/违规结算、挂单退款 | 不可以 | 可以，钱给约定收款人 | 可以 | 可以 |
| 取走自己的可领取余额 | 不可以 | 可以 | 可以 | 可以 |
| 录入案件、提交裁决结果 | 不可以 | 不可以 | 不可以 | 可以 |
| 给费用池注资 | 不可以 | 可以 | 可以 | 可以 |
| 触发已结案案件报酬入账 | 不可以 | 可以，钱给结案执行者 | 可以 | 可以 |

管理员使用 OpenZeppelin `Ownable2Step` 的 `owner()`；两步转移管理权。禁用 `renounceOwnership`，避免课堂误操作永久失去处理能力。不能使用 `tx.origin` 做权限检查。

管理员没有修改已成交价格、任意提走押金、修改买家、修改许可范围、清空用户余额或删除历史记录的接口。第一版也不提供任意提走费用池的接口。

管理员可以误判或录入虚构案件，这是信任边界，不能靠固定报酬机制解决。报酬不代表案件真实性已被合约验证。

## 5. 数据模型

所有 ID 从 1 开始，0 表示不存在。所有实体读取接口对不存在的 ID 给出明确错误；状态预览接口可返回 `None`，但不能返回看似有效的全零实体。

下面是逻辑字段规格；可优化 Solidity packing，但导出类型与语义必须完整。

### 5.1 Work

```solidity
struct Work {
    uint256 id;
    bytes32 fileHash;
    address registrant;
    string title;
    string description;
    uint8 category;
    string referenceUrl;
    uint64 registeredAt;
    uint64 invalidatedAt;       // 0：尚未撤销；非0：实际链上撤销时间
    uint256 invalidatedByCaseId;
    uint256 previousWorkId;     // 同一 fileHash 的上一条登记，首次为0
    uint256 acceptedCount;      // 累计成功成交次数，只增不减
}
```

字段限制：`title` 为 1～96 UTF-8 字节，`description` 为 0～512 字节，`referenceUrl` 最多 256 字节；不是字符数。`category` 固定为 1 图片、2 文本、3 音频、4 视频、5 其他。参考链接可为空，前端只接受 HTTP(S)，并会公开写入链上。

必须有：

- `activeWorkByHash[fileHash]`：当前有效登记，撤销后置 0。
- `latestWorkByHash[fileHash]`：最近一次登记，撤销也不清除。
- 同一哈希的历史 ID 列表；登记人名下的作品 ID 列表。

第一版规则：没有有效登记时，任何钱包可再次登记同一哈希，`previousWorkId` 自动取最新旧记录。更正不继承旧许可、不转移旧资金、不清除旧记录。**该开放规则并不能保证再次登记者就是真正作者**；反复假冒仍依赖线下处理。暂不增加管理员指定更正钱包、预约或身份认证机制。

### 5.2 Offer

```solidity
enum OfferStoredState { None, Open, Accepted, Closed }
enum OfferCloseReason { None, SellerCancelled, DeadlineExpired, WorkInvalidated }

struct Offer {
    uint256 id;
    uint256 workId;
    address seller;
    uint256 price;
    uint256 compensation;
    uint64 duration;
    uint64 acceptUntil;
    uint64 createdAt;
    string scope;
    bytes32 termsHash;
    OfferStoredState state;
    OfferCloseReason closeReason;
    uint256 licenseId;          // 未成交为0
}
```

`scope` 为 1～512 UTF-8 字节，给出明确使用范围。第一版公开挂单、先接受先成交；不做指定买家、报价修改和重复成交。卖家想改价格或条款，要取消旧挂单并创建新挂单。

押金数值由 `price + compensation` 推导，不允许不同挂单共享一笔押金。一张挂单被接受后，押金只改变归属账目，不能被卖家领走，也不能重复计算。

### 5.3 License

```solidity
enum SettlementReason { None, NormalExpiry, AuthorRevoked, WorkInvalidated }

struct License {
    uint256 id;
    uint256 offerId;
    uint256 workId;
    address seller;
    address licensee;
    uint64 startsAt;
    uint64 endsAt;
    uint64 authorRevokedAt;     // 仅登记人主动提前撤销时写入
    bool settled;              // 押金是否已经分配到可领取余额
    SettlementReason settlementReason;
    uint64 settledAt;          // 资金结算时刻，不等于许可终止时刻
}
```

价格、补偿和许可范围通过不可修改的 `offerId` 读取，不必重复保存。必须能查找：买家所有许可、某作品所有许可、某地址在某作品下的所有许可。

### 5.4 CaseRecord

```solidity
enum CaseStatus { None, Pending, Resolved }
enum CaseOutcome { None, Uphold, Invalidate }

struct CaseRecord {
    uint256 id;
    uint256 workId;
    string externalRef;
    bytes32 evidenceHash;
    address openedBy;
    uint64 openedAt;
    CaseStatus status;
    CaseOutcome outcome;
    bytes32 decisionHash;
    string decisionSummary;
    address resolvedBy;
    uint64 resolvedAt;
    uint256 rewardAmount;
    bool rewardCredited;
}
```

- `externalRef` 是线下案件编号，限定 1～64 个 ASCII 字符，只允许 `A-Z`、`0-9` 和 `-`，如 `CASE-2026-0001`。合约按 `keccak256(bytes(externalRef))` 全局去重。
- `evidenceHash`、`decisionHash` 是文件字节的 SHA-256，不能为零。原始材料不上传链。
- `decisionSummary` 为 1～512 UTF-8 字节。
- 同一 Work 同时最多一个待处理案件。维持后可用新的案件编号再开案；撤销后不能继续对该旧 Work 开案。
- 维持与撤销都算一次处理，报酬金额相同。

### 5.5 资金账目

```solidity
mapping(address => uint256) public claimable;
uint256 public totalClaimable;
uint256 public totalLockedDeposits;
uint256 public rewardPoolBalance;
uint256 public pendingCaseRewards;  // 尚未从费用池拨付的登记金额，不算已有ETH负债
uint256 public immutable gasSubsidy;
uint256 public immutable reviewReward;
```

`pendingCaseRewards` 用于显示尚未获费用池支持的报酬资格，不能在费用池不足时直接变成可提现余额。

## 6. 登记和自动格式检查

### 6.1 正常登记流程

1. 用户本地选择文件；界面准确写“选择作品文件，本地计算指纹”，不能谎称已上传保存。
2. 检查大小、扩展名、可用 MIME 和表单字段；通过 Web Crypto `SHA-256` 计算原文件指纹。
3. 查询 `activeWorkByHash`；如存在有效声明，展示对应作品，阻止重复提交。
4. 用户填写标题、简介、类别和可选参考链接，勾选“我声明拥有登记及授权所需权利”。
5. 模拟并发送登记交易。合约再次检查哈希唯一性及字段限制，防止前端检查和成交之间的竞态。
6. 等待成功回执，解析事件取新 ID，刷新相关数据并进入详情页。

文件名、文件修改时间不进入文件哈希计算。相同原始字节应得到相同哈希；内容改变应得到不同哈希。

### 6.2 格式检查器的抽象

界面展示四项结果：文件格式、文件大小、信息完整性、重复指纹。结果只有“检查中、通过、失败”，不能显示“版权审核通过”。

支持扩展名：`.png .jpg .jpeg .webp .txt .pdf .mp3 .wav .mp4`。MIME 缺失时可按扩展名继续；MIME 明显冲突时提示。校验仅是基本体验，不保证文件安全或真实格式，不能执行文件内容。

- 不接受 SVG、HTML 和可执行文件。
- 预览只做本地 PNG/JPEG/WebP，用对象 URL，用完及时释放；PDF、音频、视频第一版只显示文件名和大小。
- 文件大于 20 MiB 或 0 字节直接失败。
- 使用 `TextEncoder` 检查 UTF-8 字节数；前端不能用 `string.length` 冒充链上字节长度。
- 用户重新选择文件后，旧异步计算结果不能覆盖新文件结果。
- 允许哈希查询重试；RPC 故障显示“未完成重复检查”，不能显示为“无重复”。

链上只检查非零哈希、字段长度、类别和唯一性，不能检查用户是否真的选择了某个文件，也不能验证参考链接内容。客户端检查可被绕过，这不等于合约已经核实权属。

## 7. 授权交易和资金流：必须逐条实现

### 7.1 固定条款

第一版全部许可都是有期限、非独占、不可转让、不可转授权的许可。价格一次支付，不按秒收费；按时间计算只用于登记人提前撤销时的退款。

标准条款正文见第 22 节。前端详情页和接受确认框必须能阅读完整条款、具体 scope 和 termsHash。

`termsHash` 在链上按下面的字段顺序生成，前端可用 Viem `encodeAbiParameters` 复算，不得使用 `JSON.stringify` 结果代替 ABI 编码：

```text
keccak256(abi.encode(
  uint256 chainId,
  address marketAddress,
  uint256 offerId,
  uint256 workId,
  bytes32 fileHash,
  address seller,
  uint256 price,
  uint64 duration,
  uint256 compensation,
  uint64 acceptUntil,
  string scope,
  bytes32 TERMS_VERSION
))
TERMS_VERSION = keccak256(bytes("CopyrightLicenseTerms/v1"))
```

`chainId = block.chainid`、`marketAddress = address(this)`。ABI 编码类型与字段顺序均为协议的一部分。

### 7.2 创建挂单

只允许 Work 登记人创建，Work 必须有效；`msg.value` 必须恰好等于 `P + C`。不接受不足或多付，不能自动把多余 ETH 放到账户余额。

创建成功增加 `totalLockedDeposits`，挂单状态为 Open。对同一作品可以创建多张挂单，每张都单独存足押金；非独占许可允许不同买家同时拥有许可。

### 7.3 买家接受

必须同时满足：

- 挂单存储状态 Open，作品尚未撤销，未到接受截止时间。
- 买家不等于卖家。
- `msg.value == P`。
- 买家提交的 `expectedTermsHash` 等于挂单 termsHash，防止使用错误条款发交易。

同一笔成功交易中：挂单变 Accepted，创建 License，`startsAt = block.timestamp`，`endsAt = startsAt + T`；将价格 P 记入卖家 `claimable`；作品 `acceptedCount` 加 1。

押金 D 仍锁定，`totalLockedDeposits` 不变。许可没有文件交付确认期，不等待卖家再同意。

并发两个买家时，按链上执行顺序只有一个成交，另一笔整体回滚，不得留下付款或部分状态。

### 7.4 未成交挂单的取消和退押金

- 在有效、未到期的 Open 挂单上，卖家可以取消；押金全额进入卖家 `claimable`。
- 未成交挂单到期，或所属 Work 被撤销后，任何人都可以触发退款，押金仍然只给卖家。
- 如卖家点击“取消”时挂单已到期或作品已撤销，应提示使用“退回押金”入口；不能用不同入口重复退钱。
- 未成交挂单没有买家，因此不发生违约补偿，也不把这笔押金付给管理员。
- 取消、到期退款、违规退款后，不能重新打开；想再卖就另建挂单。

### 7.5 登记人主动提前撤销许可

仅许可中记录的卖家可以操作，且许可当前有效、尚未结算、Work 尚未撤销。

设：

```text
P = 许可价格
C = 固定补偿
D = P + C
T = endsAt - startsAt
e = revokeTimestamp - startsAt，范围 0 <= e < T
E = floor(P * e / T)           // 已履行期限对应金额
U = P - E                     // 剩余期限退款
买家获得 = U + C
卖家取回押金 = E
```

使用 `Math.mulDiv(P, e, T)` 或同等精度的安全整数计算。先对 E 向下取整，再算 U；不能分别向下计算 E 和 U 造成少付尾数。

同一笔交易写入 `authorRevokedAt`、标记押金已结算、记录结算原因、减少锁定总额，并给双方账户入账；不得先撤销、后依赖卖家补付款。

**完整经济例子：** P = 0.001 ETH，C = 0.0002 ETH，D = 0.0012 ETH，期限 30 天。15 天时撤销，买家可领取 0.0007 ETH，卖家取回押金 0.0005 ETH。卖家先前已收 0.001 ETH，但最初投入了 0.0012 ETH 押金，所以扣除补偿后的净收入为 0.0003 ETH，另计网络 Gas。

### 7.6 正常到期

时间到达 `endsAt` 时许可自然失效，不需要交易才能失效。但退回押金必须有交易。

如果没有更早发生的管理员撤销，任何人可触发结算，D 全额记入卖家余额。调用者不能指定收款人，也没有额外赏金。

### 7.7 管理员撤销登记后的许可处理

管理员只修改 Work 的撤销状态和案件记录，不遍历全部许可。撤销生效后：

1. 不允许该 Work 新挂单，也不允许接受其旧未成交挂单。
2. 尚有效的许可立即终止，历史查询开始体现终止。
3. 对每份受影响许可，任何人可分别触发押金结算；D = P + C 全额给该许可买家，卖家得到 0。
4. 未成交挂单的 D 退给挂单卖家。
5. 已经提前撤销并结算的许可不再赔一次；在登记撤销前已经到期的许可，也不改成全额赔偿。

不能出现“撤销作品时循环所有挂单或买家”的实现。

### 7.8 结算结果的确定优先级

必须按**业务事件何时发生**判断，而不是按用户什么时候来领钱判断：

```text
如果 license.settled：禁止再次结算。
否则，如果 authorRevokedAt != 0：正常路径下本应已经原子结算；视为异常状态，不二次分配。
否则，如果 work.invalidatedAt != 0 且 work.invalidatedAt < license.endsAt：
    WorkInvalidated，全部 D 给买家。
否则，如果 block.timestamp >= license.endsAt：
    NormalExpiry，全部 D 给卖家。
否则：
    仍在履约，不能结算。
```

特别规定：

- Work 在许可到期之后才被撤销，即使卖家一直没领押金，仍按正常到期退押金。
- Work 恰好在 `endsAt` 被撤销，该许可已到期，仍按正常到期。
- Work 在到期前被撤销，即使买家等到原定到期日之后才结算，仍全额给买家。
- 卖家撤销许可后，随后 Work 才被撤销，不补差额。第一版只兑现首次终止时确定的补偿。
- 同一时间戳内先后执行的交易，仍按链上执行结果工作：作者撤销先成功会立即结算；管理员撤销先成功则阻止作者撤销。测试必须覆盖这两种顺序。

### 7.9 统一领取方式

所有退款、卖家收入、押金释放和管理员报酬先进入 `claimable`。真正发送 ETH 的唯一常规入口是 `withdraw(address payable recipient)`。

只允许调用者提取自己的全部余额，收款地址可以是其指定的非零地址。不能提供 `withdrawFor(victim, attacker)` 这样的接口。

提现执行 checks-effects-interactions，并使用 `nonReentrant`；先清余额和总额，再低级 `call` 转账。转账失败整笔回滚，不损失余额。收款合约拒收 ETH 不应阻断许可撤销或其他人的提现。

界面必须区分“许可已终止”“赔偿已入可领取余额”“已提现到钱包”三个事实。

## 8. 案件处理、费用池与报酬

### 8.1 案件流程

线下举证、审理、材料交流不在 DApp 内实现。管理员得到材料后，在管理页：

1. 录入 Work、唯一案件编号、证据文件 SHA-256，创建 Pending 案件。
2. 核对裁决材料，选择 Uphold（维持登记）或 Invalidate（撤销登记）。
3. 提交裁决文件 SHA-256 和摘要，完成链上结案。
4. 撤销结果写入 Work，并清除对应有效哈希指针；维持结果不改变 Work。
5. 记录本次结案执行者和固定报酬金额，提供报酬入账按钮。

Pending 仅是待处理标记，第一版不冻结交易。前端在作品详情展示“有待处理案件”。管理员不能输入过去或未来的生效时间，撤销时间固定为提交交易的链上时间。

案件不可删除、改判或重复结案。第一版不提供撤销后恢复旧 Work 的功能；更正通过新登记完成。

### 8.2 固定酬劳规则

每个已结案案件的 `rewardAmount = gasSubsidy + reviewReward`。两项从构造参数固定，前端分开展示，总额领取。

这是一笔固定补贴，不按实际 gasUsed 精确报销，也不承诺总能覆盖实际 Gas。执行者必须先有足够 ETH 提交交易；不实现 relayer、免 Gas 或账户抽象。

结案本身不依赖费用池是否有钱：

- `resolveCase` 即使费用池为 0 也必须成功。
- 结案后将 rewardAmount 计入 `pendingCaseRewards`，但不凭空增加可提现余额。
- `creditCaseReward(caseId)` 检查已结案、尚未入账且费用池足够，扣减费用池、减少 pending 总额，给 `resolvedBy` 增加可领取余额。
- 任何地址可触发入账，但收款人始终是该案结案时记录的执行者。管理员换人后也不能把旧案报酬转给新管理员。
- 费用池不足时，报酬入账失败并显示“等待费用池注资”；案件结果不回滚。
- 不部分入账；不重复入账；提现失败也不能因此再领一次报酬。

`fundRewardPool()` 是明确的 payable 注资入口，任何地址可以注资。拒绝普通 `receive/fallback` 的误转；被强制转入的 ETH 不计入任何用户余额，也不自动视为费用池。第一版不做这部分意外盈余的提取功能。

费用池不从受害买家的补偿里扣钱，也不从现有押金余额里借钱。

## 9. 状态展示与历史查询

### 9.1 派生状态

对外状态枚举固定如下，顺序即 ABI 数值顺序，前端从导出类型引用，不另写不同顺序：

```solidity
enum WorkStatus { None, Active, Invalidated }
enum OfferStatus { None, Open, Accepted, Cancelled, Expired, Invalidated }
enum LicenseStatus { None, Active, AuthorRevoked, WorkInvalidated, Expired }
```

作品：不存在、有效、已撤销。

挂单显示状态：不存在、可接受、已成交、卖家取消、已到期、作品已撤销。尚未触发退款的到期或违规挂单，也必须立即显示不可接受；不能仅看存储中的 Open。

挂单状态的确定规则：已成交保持 Accepted，通过关联 License 展示其后续状态；已关闭按 closeReason 展示，不被后来事件改写；仍为 Open 时，如果 Work 撤销发生在 acceptUntil 之前，展示 Invalidated，否则到达 acceptUntil 展示 Expired，其余展示 Open。撤销时间恰好等于截止时间时按 Expired。退款时把同一个派生原因写入 closeReason，避免领取前后显示不同终止原因。

许可显示状态：不存在、有效、登记人提前撤销、登记撤销导致终止、已到期。另用独立字段显示押金已结算/待结算，不能将“已结算”误当成许可状态。

许可状态判断：先看作者提前撤销记录，再看到期前的 Work 撤销，再看当前是否到期。Work 到期后撤销，不把已到期许可显示成“违规终止”。

### 9.2 精确查询语义

查询输入：钱包地址、workId、时间 t。也允许先选择文件计算哈希，再找到该哈希全部登记版本。

对于一份许可 L：

```text
validAt(L, t) =
    L.startsAt <= t
    AND t < L.endsAt
    AND (L.authorRevokedAt == 0 OR t < L.authorRevokedAt)
    AND (Work.invalidatedAt == 0 OR t < Work.invalidatedAt)
```

只允许 `t <= 当前链上时间`。未来时间显示“未来许可状态尚不能确定”，不预测未发生的撤销。

“某地址在某作品下有有效许可”表示该地址至少有一份满足条件的许可。许可可重叠，不强行合并，不因已有许可禁止再次购买。

特别要求：

- 查询过去时不能只取当前状态；后来撤销不把撤销前的整段历史改成无记录。
- 同一 fileHash 的新旧 Work 不共用许可。按文件查询时可以合并展示所有版本的历史结果，但必须注明具体 workId。
- 资金结算和提现时刻不影响许可的有效区间。
- 返回匹配的 licenseId、workId、登记人、买家、范围、条款哈希、起止时间、实际终止原因和 Work 当前是否已撤销。
- 若过去存在许可而 Work 后来被撤销，显示“当时存在平台许可记录；该登记后来已撤销”，避免暗示真实权属已经证明。
- 查询失败或尚未加载完整分页时不能显示“无许可”。有任意匹配时可提前给出肯定结果，但结果列表仍可继续加载。

时间查询精度为秒。一个时间戳内的多个交易采用该秒结束后的历史视角，不提供“该秒某笔交易之前”的精确查询；原始交易顺序可从区块号、transactionIndex 和 logIndex 查看。不要引入复杂的全局逻辑时钟。

## 10. 对外合约接口约定

以下是必须实现的语义接口。返回的结构体由 ABI 导出，实施时可以增加只读便利方法，但不能增加任意资金转移入口。

### 10.1 构造和核心写入

```solidity
constructor(address initialOwner, uint256 gasSubsidy_, uint256 reviewReward_);

function registerWork(
    bytes32 fileHash,
    string calldata title,
    string calldata description,
    uint8 category,
    string calldata referenceUrl
) external returns (uint256 workId);

function createOffer(
    uint256 workId,
    uint256 price,
    uint64 duration,
    uint256 compensation,
    uint64 acceptUntil,
    string calldata scope
) external payable returns (uint256 offerId);

function cancelOffer(uint256 offerId) external;
function refundUnavailableOffer(uint256 offerId) external;

function acceptOffer(uint256 offerId, bytes32 expectedTermsHash)
    external payable returns (uint256 licenseId);

function revokeLicense(uint256 licenseId) external;
function settleLicense(uint256 licenseId) external;
function withdraw(address payable recipient) external;

function openCase(
    uint256 workId,
    string calldata externalRef,
    bytes32 evidenceHash
) external returns (uint256 caseId);

function resolveCase(
    uint256 caseId,
    CaseOutcome outcome,
    bytes32 decisionHash,
    string calldata decisionSummary
) external;

function fundRewardPool() external payable;
function creditCaseReward(uint256 caseId) external;
```

`registerWork`、案件函数等非 payable 方法不收 ETH。`fundRewardPool` 拒绝 0 金额；构造参数 owner 必须非零，建议限制单案总补贴不超过 0.01 ETH，防止部署时误填单位。

`cancelOffer` 限卖家且要求当前可接受；`refundUnavailableOffer` 无权限限制，但只在仍未成交、尚未退款，且到期或作品已撤销时可调用。

`settleLicense` 无权限限制，只执行第 7.8 节的到期/管理员撤销分支；登记人主动撤销只能经 `revokeLicense` 原子执行。

### 10.2 读取和预览

```solidity
function getWork(uint256 workId) external view returns (Work memory);
function getOffer(uint256 offerId) external view returns (Offer memory);
function getLicense(uint256 licenseId) external view returns (License memory);
function getCase(uint256 caseId) external view returns (CaseRecord memory);

function getWorkStatus(uint256 workId) external view returns (WorkStatus);
function getOfferStatus(uint256 offerId) external view returns (OfferStatus);
function getLicenseStatus(uint256 licenseId) external view returns (LicenseStatus);

function isLicenseValidAt(uint256 licenseId, uint64 at)
    external view returns (bool);

function previewAuthorRevoke(uint256 licenseId)
    external view returns (uint256 buyerCredit, uint256 sellerCredit);

function previewSettlement(uint256 licenseId)
    external view returns (
        bool canSettle,
        SettlementReason reason,
        uint256 buyerCredit,
        uint256 sellerCredit
    );

function getAccounting() external view returns (
    uint256 contractBalance,
    uint256 locked,
    uint256 totalUserCredits,
    uint256 rewardPool,
    uint256 pendingRewards,
    uint256 surplus
);
```

预览与实际执行必须复用相同内部计算函数。前端估算的结果可能因下一区块时间变化而略变；主动撤销确认框必须提示以交易执行时的链上时间为准。

`previewAuthorRevoke` 对无效状态给出明确错误；`previewSettlement` 对存在但不可结算的许可返回 `canSettle=false`，金额为 0；不存在的 ID 仍报不存在。

暴露 `owner()`、`pendingOwner()`、`claimable(address)`、`activeWorkByHash(bytes32)`、`latestWorkByHash(bytes32)`、`openCaseByWork(uint256)`、各实体总数、费用参数和 `TERMS_VERSION`。

### 10.3 分页索引

必须提供以下读取，每个返回 `(uint256[] ids, uint256 total)`：

```text
getWorkIds(offset, limit)
getWorkIdsByRegistrant(registrant, offset, limit)
getWorkIdsByHash(fileHash, offset, limit)
getOfferIdsByWork(workId, offset, limit)
getOfferIdsBySeller(seller, offset, limit)
getLicenseIdsByWork(workId, offset, limit)
getLicenseIdsByLicensee(licensee, offset, limit)
getLicenseIdsByUserAndWork(licensee, workId, offset, limit)
getCaseIds(offset, limit)
getCaseIdsByWork(workId, offset, limit)
```

`offset` 为从 0 开始的数组偏移，按 ID 创建顺序升序；`limit` 必须在 1～50。`offset >= total` 返回空数组，不回滚；不做 `offset + limit` 溢出的写法。

第一版由前端分页取 ID，再批量读取实体。所有链上写操作不得遍历增长中的全局列表。链上分页循环最多 50 条。

## 11. 事件、错误与接口导出

### 11.1 最低事件集

| 事件 | 必须包含的业务字段 |
| --- | --- |
| WorkRegistered | workId、fileHash、registrant、previousWorkId、registeredAt |
| WorkInvalidated | workId、caseId、executor、invalidatedAt |
| OfferCreated | offerId、workId、seller、price、compensation、duration、acceptUntil、termsHash |
| OfferClosed | offerId、seller、closeReason、returnedDeposit |
| OfferAccepted | offerId、licenseId、workId、buyer、startsAt、endsAt |
| LicenseRevoked | licenseId、workId、seller、revokedAt |
| LicenseSettled | licenseId、reason、buyer、seller、buyerCredit、sellerCredit、effectiveEndAt、settledAt |
| BalanceCredited | account、amount、来源枚举、sourceId |
| Withdrawal | account、recipient、amount |
| CaseOpened | caseId、workId、externalRef、evidenceHash、openedBy |
| CaseResolved | caseId、workId、outcome、decisionHash、resolvedBy、rewardAmount |
| RewardPoolFunded | funder、amount、新费用池余额 |
| CaseRewardCredited | caseId、executor、amount |

每个事件最多 3 个 indexed 字段，优先实体 ID 和相关地址。历史记录以链上存储和事件为准，不能只存在浏览器 localStorage。

### 11.2 自定义错误

至少区分：实体不存在、非登记人、非管理员、零哈希、重复有效登记、字段过长/为空、非法类别、非法金额、非法期限/截止时间、作品已撤销、挂单不可接受、挂单未达到退款条件、自己购买、条款不匹配、许可不活跃、许可尚不可结算、重复结算、未来历史查询、案件编号重复、已有待处理案件、案件已结案、非法裁决结果、报酬已入账、费用池不足、余额为零、零收款人、ETH 转账失败、非法分页。

前端维护错误到中文文案的映射，保留“查看技术详情”入口；不要把完整 RPC 堆栈当主要提示。OpenZeppelin 自带错误也要处理。

### 11.3 ABI 和部署描述

`contracts/scripts/export-interface.ts` 导出到 `frontend/src/generated/`：

```text
copyrightMarketAbi.ts      // `as const`，用于 Viem 类型推导
deployments.json           // 各链部署信息
interface-manifest.json    // schemaVersion、termsVersion、导出时间、编译信息
```

`deployments.json` 每条链至少包含：

```json
{
  "schemaVersion": 1,
  "deployments": {
    "31337": {
      "address": "<真实部署后写入的0x地址>",
      "deploymentBlock": "<十进制区块号字符串>",
      "deploymentTxHash": "<真实交易哈希>",
      "runtimeCodeHash": "<链上运行时代码的keccak256>",
      "deployedAt": "<ISO-8601 UTC时间>",
      "termsVersion": "CopyrightLicenseTerms/v1"
    }
  }
}
```

上例是字段格式，不是可直接提交的部署数据。未部署网络不填假地址，前端显示“该网络尚未部署”。部署记录不得包含私钥、助记词或付费 RPC 密钥。

本地链重置后要重新部署并导出；缓存不能仅凭 chainId 判断是同一次部署。

## 12. 资金与安全不变量

### 12.1 每次写操作后必须成立

```text
合约实际ETH余额 >= totalLockedDeposits + totalClaimable + rewardPoolBalance
surplus = 实际余额 - 上述三项
totalClaimable = 所有地址 claimable 的和
```

`totalLockedDeposits` 应等于：所有存储状态 Open 且未退押金挂单的 D，加上所有尚未结算许可的 D。已成交 Offer 不再单独计押金，避免与 License 双重计算。

`pendingCaseRewards` 不包含在已有资金覆盖式中；它表示等待拨付的报酬资格。费用池不足不能侵占其他两项资金。

### 12.2 资产守恒

- 创建挂单：合约余额 +D，锁定 +D。
- 接受挂单：余额 +P，卖家可领取 +P，锁定不变。
- 取消/退款/许可结算：锁定 -D，各收款人可领取总计 +D，余额不变。
- 注资：余额 +F，费用池 +F。
- 案件报酬入账：费用池 -R，执行者可领取 +R，余额不变。
- 提现：余额 -W，用户可领取 -W。

不允许“登记人先撤销再补款”、不同挂单共用押金、先转钱后更新状态、用实际余额替代账本判断可支出金额、管理员直接从合约余额取钱。

### 12.3 实现约束

- 使用标准 OpenZeppelin 权限和重入保护，不自行写一套难以审查的鉴权框架。[权限文档](https://docs.openzeppelin.com/contracts/5.x/access-control)、[工具文档](https://docs.openzeppelin.com/contracts/5.x/api/utils)。
- 常规业务只在提现时对任意外部地址执行 ETH call；其他业务仅更新内部账目。
- 不引入无上限写入循环。一个作品有 1 万份许可时，管理员撤销也应是常数规模操作。
- 不在生产合约留下测试专用改时间、改余额、任意改状态的函数。
- 验证部署字节码大小低于 EIP-170 上限，使用正常链限制测试，不通过 `allowUnlimitedContractSize` 隐藏超限问题。
- 私钥只用于合约工程部署，不进入 `VITE_*` 环境变量、浏览器源码或前端产物。
- 所有链上字符串在 React 中作为纯文本展示；禁止 `dangerouslySetInnerHTML` 渲染作品简介、scope 或案件摘要。

## 13. 前端页面与交互要求

### 13.1 公共布局

顶部：产品名、Discover、登记作品、我的账户、使用权查询入口、钱包连接、当前网络。管理入口只有当前 `owner()` 连接时显示，但合约仍须独立做权限校验。

支持 360px 手机宽度和桌面宽度，无横向溢出。统一金额、日期、地址和状态徽标格式；长地址和哈希可复制，详情可查看完整值。

未连接钱包也能浏览和查询；写操作时才要求连接。没有 MetaMask 时展示安装指引，不循环弹连接框。

使用简洁作品卡片和明确交易信息，不为追求视觉效果隐藏押金、期限、补偿金额和案件状态。不展示作品封面缩略图；详情页显示可选作品参考链接。

### 13.2 Discover：`/`

- 最新登记和热门作品两个视图。
- 标题关键字搜索、类别筛选、清除筛选。
- 卡片显示标题、类别、登记人、登记时间、累计成交数、有无可接受挂单。
- 默认隐藏已撤销作品，提供“包含已撤销”开关。
- 最新按 registeredAt 降序、workId 降序；热门按 acceptedCount 降序、registeredAt 降序、workId 降序。
- 搜索对标题 trim 后进行不区分大小写的包含匹配；第一版不做全文检索和模糊搜索。
- 热度为累计成交许可数量，不是独立买家数、浏览量或成交额。0 成交时显示“暂无成交”，不伪造热度。

### 13.3 作品详情：`/works/:workId`

展示全部元信息、文件哈希、登记版本链、当前状态、案件历史、挂单、相关许可记录和交易事件摘要。

登记人操作：创建挂单；取消或退回未成交挂单押金；查看自己出售的许可并主动撤销。

买家操作：阅读条款并接受挂单；查看自己的许可和可结算赔偿。

报价卡必须显示 P、T、C、scope、接受截止时间。卖家创建时显示“需锁定押金 D”；买家接受时显示“本次支付 P + 网络手续费，押金由登记人承担”。

不能在一个页面只显示全站统一固定价格，实际交易却用另一个挂单金额。

### 13.4 登记页：`/register`

实现第 6 节流程：选择文件、四项检查、标题简介类别可选参考链接、声明勾选、提交与回执。检查失败前禁止签名；合约仍做自己的必要检查。

作品文件只在浏览器本地处理；页面明确说明“本应用不保存原文件，请自行保管”。登记后的页面即使刷新，也能从链上恢复标题和简介，但不能假装能重新下载原文件。

### 13.5 我的账户：`/account`

包含：我的登记、我发布的挂单、我购买的许可、我出售的许可、资金概览。

资金概览至少显示：可领取余额、仍锁定在未成交挂单的押金、仍锁定在许可的押金、已经可以触发结算但尚未入账的金额。分类金额不可重复计入。

提供“领取全部余额”按钮；到期/违规结算采用逐笔操作，第一版不做无限批量交易。如果提供“全部处理”，也只能是前端依次发送有界独立交易，默认不实现。

管理员账户还显示自己的待入账案件报酬，但不能把它加到已可提现余额里。

### 13.6 使用权查询：`/verify`

独立地址方便课堂展示；也可从详情页预填跳入。输入地址、workId 或文件哈希、查询时间，默认当前链上时间。

显示“存在有效平台许可”“没有匹配的平台许可”“查询尚未完成/失败”三种不同结果。列出匹配许可和时间轴；时间轴用简单起止列表即可，不强制图形组件。

按 fileHash 查询时显示所有登记版本，不把新登记的授权误套在旧登记上。页面无需连接钱包。

### 13.7 管理页：`/admin`

显示费用池、每案固定补贴、每案处理费、待拨付报酬总额、费用池注资表单、案件列表。

提供录入案件、核对 Work、选择结果、证据和裁决文件哈希、摘要、确认结案、报酬入账功能。哈希可从本地材料文件计算，也允许粘贴有效 bytes32；不得宣称文件已上传。

撤销确认框必须说明：该声明将停止新交易，尚有效许可将终止，买家逐笔结算；原记录不会删除。维持确认框也必须明确不改变登记状态。

非管理员访问显示权限说明，保持只读基础内容，不能仅靠隐藏按钮当鉴权。

### 13.8 统一交易状态

每次写操作至少区分：校验中、模拟中、等待钱包确认、交易已提交、等待链上确认、成功、用户拒绝、链上失败、RPC 暂时不可用。

- 在已提交和待回执状态禁止重复点击。
- 用户拒签后保留表单，可再次尝试。
- 有交易哈希就显示链接；本地无浏览器时显示可复制哈希。
- 钱包切换账户/网络后，不能把旧账户的回执结果写入新账户的余额视图。
- 以成功回执为写入完成依据，不凭钱包弹窗关闭就 toast 成功。
- 成功后按相关 query key 失效缓存，失败不伪造成功状态。
- 不自动发起写交易或自动要求用户签名；按钮明确发起。

## 14. 前端数据层、缓存与性能

### 14.1 推荐分层

```text
src/generated/                 ABI与部署描述，只由导出脚本更新
src/config/                    网络、运行环境、Wagmi providers
src/domain/                    纯业务类型、状态/时间/金额工具、校验
src/services/marketGateway.ts   合约读取、预览、写入请求构造
src/hooks/                     Query和钱包适配，页面不直接拼ABI
src/features/                  discover/register/work/account/verify/admin
src/components/                状态徽标、金额、地址、交易反馈、空状态
src/styles/                    色彩、间距、排版、响应式
```

`domain` 不依赖 React、Wagmi 或 Hardhat，便于测试。不能在 UI 中实现第二套会与合约不同的结算公式；金额预览以合约返回为准，纯计算仅供解释和单元校验。

### 14.2 第一版读取策略

使用链上分页索引，无需后端。获取 ID 后用有限并发或 Viem 批量读取；本地链没有 Multicall3 时必须能回退到普通 RPC 读取。

Discover 可以在课堂规模下分页读取全目录，前端做搜索和排序。正式要求：至少支持 200 件作品的读取流程，并正确显示“正在加载更多”。不能只读取前 20 条就声称已做全站热门排行。

建议限制并发 4～8，每批最多 50 个实体。请求失败可重试，不能把错误数据缓存成空列表。数据未全部加载时展示“已加载 n / total”，全目录加载完成后再显示最终热门排序。

### 14.3 查询键和刷新

查询键至少包括 `chainId + contractAddress + deploymentIdentity + 业务参数`；账户相关还包括地址。deploymentIdentity 使用部署交易哈希或配置中的部署标识。

- 链和账户变动时清理相关查询，不混用账户数据。
- 当前状态依赖时间，不仅依赖交易。使用最新区块时间刷新派生状态，或对临近截止的项目每 10～15 秒刷新；本地链无新区块时说明以链上时间为准。
- 客户端倒计时只是展示，不决定能否接受或结算；执行前重新模拟。
- 监听区块/事件可以辅助刷新，但基础正确性不能只依赖 WebSocket 监听成功。
- 重启浏览器、清空 localStorage 后，仍能从链重建业务状态。localStorage 只存连接偏好和非关键缓存。
- 若本地 RPC 重置，检测部署区块哈希变化、已缓存链高倒退或部署代码不存在时，清空该网络缓存并提示重新部署。开发说明要求重置后重新导出和刷新页面。

## 15. 仓库目录与交付文件

建议最终结构：

```text
copyright-dapp/
  README.md
  .gitignore
  .nvmrc
  contracts/
    package.json
    package-lock.json
    tsconfig.json
    hardhat.config.ts
    .env.example
    contracts/
      CopyrightMarket.sol
      libraries/ 或内部辅助文件（按需要）
    test/
      registration.test.ts
      offers.test.ts
      licenses.test.ts
      cases.test.ts
      accounting.test.ts
      adversarial.test.ts
      helpers/
    scripts/
      deploy.ts
      export-interface.ts
      seed-local.ts
      smoke.ts
    deployments/
      31337.json
      11155111.json（真实部署后才出现）
    fixtures/
      课堂演示用、权利清晰的小文件及说明
  frontend/
    package.json
    package-lock.json
    tsconfig*.json
    vite.config.ts
    .env.example
    src/...
    public/ 首页等静态资源
    tests/
  docs/
    BUSINESS-RULES.md
    LICENSE-TERMS-V1.md
    LOCAL-DEMO.md
    SEPOLIA-DEPLOYMENT.md
    VALIDATION.md
```

不要求根目录使用 npm workspaces。根 README 可以依次调用两个工程脚本，但必须保留各自独立安装能力。

`VALIDATION.md` 写明实际运行的环境、命令、结果、未完成验证及原因；不能只写“应该能跑”。

## 16. 脚本、环境变量与部署

### 16.1 对外 npm 命令约定

合约工程至少提供：

```text
npm run compile
npm test
npm run node
npm run deploy:local
npm run seed:local
npm run export:interface -- --chain-id 31337
npm run smoke:local
npm run deploy:sepolia
npm run smoke:sepolia
```

前端工程至少提供：

```text
npm run dev
npm run typecheck
npm run lint
npm test -- --run
npm run test:e2e
npm run build
npm run preview
```

这些是实施后应实现的 npm script 名称，不是断言当前目录已经有这些命令。内部 Hardhat 3 CLI 调用按所选版本官方文档编写，不照搬 Hardhat 2。

### 16.2 环境配置

合约 `.env.example`：

```dotenv
SEPOLIA_RPC_URL=
DEPLOYER_PRIVATE_KEY=
INITIAL_ADMIN_ADDRESS=
ETHERSCAN_API_KEY=
```

使用 Hardhat 配置变量/keystore 或本地未提交 `.env` 均可；必须遵守所选 Hardhat 3 的配置方式。部署脚本验证账户、网络和非零管理员，不能打印私钥。`.env`、keystore、助记词文件不能进版本库。

前端 `.env.example`：

```dotenv
VITE_DEFAULT_CHAIN_ID=31337
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
VITE_SEPOLIA_RPC_URL=
```

`VITE_*` 都会进入浏览器，必须视为公开信息。Sepolia 前端 RPC 只使用允许浏览器公开使用、已配置来源限制的 URL；不能塞入管理员部署私钥或服务端秘密。第一版浏览器扩展钱包连接不要求 WalletConnect project ID。

### 16.3 本地开发步骤

1. 安装 Node 和两个工程依赖。
2. 编译并运行合约测试，保持正常大小和 Gas 限制。
3. 启动 Hardhat 本地节点，chainId 固定 31337，RPC 默认 127.0.0.1:8545。
4. 使用本地测试账户部署，owner 为专用管理员账户 A。
5. 从部署结果生成部署描述与 ABI，导出到前端。
6. 用 seed 脚本注资费用池、登记样例作品、创建挂单和少量成交。
7. 启动前端；给 MetaMask 添加本地网络，使用单独测试账户 B、C、D 演示作者和买家。
8. 执行 smoke 与浏览器检查。

本地公开测试账户只用于本地链，不能用于 Sepolia 或承载真实资金。README 不要求用户把任意生产钱包助记词交给脚本。

### 16.4 样例数据

至少准备 6 件小型样例作品，覆盖 3 个类别、0/1/2 笔成交、未成交挂单、有效许可、作者撤销许可、违规撤销声明和新旧登记关联。费用池不少于 2 个案件的补贴。

样例文件放在合约 fixtures 或明确的示例目录，内容使用项目自制文本和简单自制图形。seed 用真实交易生成样例，页面不硬编码假余额和假历史。

`seed:local` 必须检查 chainId = 31337，拒绝对 Sepolia 或其他链批量造样例；可写部署对应的 seed marker，重复执行时明确拒绝或幂等，不悄悄重复注册。

本地快速演示可用 120 秒或更短但不低于 60 秒的许可；通过 Hardhat RPC 在测试或专用本地演示脚本推进时间。前端生产页面不提供“任意改时间”按钮，也不暴露测试助记词。

### 16.5 Sepolia

- Sepolia chainId 为 11155111；使用独立测试部署账户和 MetaMask 测试钱包。
- 合约实际部署在 Sepolia，MetaMask 是连接与签名工具，不是合约部署的存放位置。
- 部署前明确打印链名、chainId、部署账户、公有管理员地址和参数；部署后保存真实交易哈希、地址、区块、运行时代码哈希并导出前端。
- 部署脚本只允许 chainId 31337 或 11155111，遇到其他链立即拒绝；不能只在前端限制网络。
- 部署与费用池注资分成两笔；费用池没钱不阻止版权撤销。
- 前端支持切换到 Sepolia，不支持写入主网。网络不受支持时禁用交易并提供明确切换入口。
- `smoke:sepolia` 默认只读，核对链、代码、owner、条款版本、费用参数和列表读取；不能默认批量创建收费交易。
- 如实际拥有用户提供的测试配置和授权，可完成测试部署；否则交付可执行流程并如实标注。不要为获取水龙头资产注册账户或提交个人信息。
- 有可用验证配置时执行合约源码验证；没有 API key 时不影响基本交付，但记录未验证。

静态前端可部署到支持 HTTPS 的静态托管。使用 BrowserRouter 时配置 SPA fallback；不能配置时可选 HashRouter 并在 README 说明。刷新 `/works/1`、`/verify` 等入口不能 404。

## 17. 测试计划：核心资金逻辑不可省略

这不是要求给所有 UI 小组件写测试。测试重点是资金守恒、状态边界、权限、历史查询和实际页面与合约的连接。

### 17.1 登记

| 编号 | 场景 | 期望 |
| --- | --- | --- |
| R01 | 正常登记 | 字段、登记人、时间、索引、事件正确 |
| R02 | 同哈希有效登记重复提交 | 第二笔回滚，不新增 ID 或状态 |
| R03 | 零哈希、空标题、超长 UTF-8、非法类别、超长参考链接 | 正确拒绝 |
| R04 | 撤销后同哈希重新登记 | 新 ID，previousWorkId 正确，旧许可不迁移 |
| R05 | 同名但不同文件哈希 | 可以登记；不按标题去重 |

### 17.2 挂单与购买

| 编号 | 场景 | 期望 |
| --- | --- | --- |
| O01 | 非登记人挂单、撤销 Work 挂单 | 拒绝 |
| O02 | 押金少付/多付、期限/截止时间越界 | 拒绝，资金状态不变 |
| O03 | 正常挂单 | 逐单锁足 D，条款哈希可按 ABI 复算 |
| O04 | 正常接受 | 买家许可生效，P 给卖家余额，D 仍锁定 |
| O05 | 少付/多付/自己购买/条款哈希错误 | 拒绝 |
| O06 | 两个买家先后竞争同单 | 仅一笔成功，无残留付款 |
| O07 | 接受截止前一秒/恰好截止 | 前者可以，后者拒绝 |
| O08 | 卖家取消 | D 全返；非卖家不能取消活跃挂单 |
| O09 | 挂单过期/Work撤销后第三方触发退款 | 钱给卖家；不能重复退款 |
| O10 | 两张挂单 | 押金独立，一张结算不影响另一张 |

### 17.3 许可和历史查询

| 编号 | 场景 | 期望 |
| --- | --- | --- |
| L01 | 许可开始前/开始时/到期前/恰好到期 | false/true/true/false |
| L02 | 正常到期第三方结算 | D 给卖家，之后不可再次结算 |
| L03 | 正常到期但还没结算 | 查询已无效，不再显示有效 |
| L04 | 中途撤销 | 按 E、U、C 精确分配，状态原子完成 |
| L05 | 开始同秒撤销/到期前一秒撤销 | 边界退款正确，买家补偿不低于 C |
| L06 | P 不能被 T 整除 | 买卖双方分配和严格等于 D |
| L07 | 非卖家撤销、到期后撤销、重复撤销 | 拒绝 |
| L08 | Work 到期前撤销，买家很久后才结算 | D 全给买家 |
| L09 | Work 到期后撤销，卖家尚未结算 | D 仍给卖家 |
| L10 | Work 撤销时间恰好等于 endsAt | 正常到期结算 |
| L11 | 作者先撤销、后管理员撤销 | 不二次赔偿，不重算旧分配 |
| L12 | 管理员先撤销、后作者尝试撤销 | 作者操作失败，买家获 D |
| L13 | 同秒不同交易顺序 | 两种顺序均符合 L11/L12；不靠时间戳猜顺序 |
| L14 | 后来撤销后查询撤销前与撤销时 | 前者有历史记录，后者无有效许可 |
| L15 | 提现前后、结算前后查询同一过去时间 | 结果不变 |
| L16 | 同买家重叠许可、多登记版本 | 正确列出每份，不误合并旧新 Work |
| L17 | 查询未来时间、无效 ID | 明确错误；不返回误导性 true/false |

### 17.4 案件和补贴

| 编号 | 场景 | 期望 |
| --- | --- | --- |
| C01 | 非管理员开案/结案 | 拒绝 |
| C02 | 非法编号、重复编号、零证据、重复 Pending | 拒绝 |
| C03 | 维持登记 | Work 不变，案件结案，报酬资格生成 |
| C04 | 撤销登记 | 单次修改 Work，交易受阻，许可派生失效 |
| C05 | 空费用池撤销 | 裁决成功；报酬暂不能入账 |
| C06 | 注资后触发报酬入账 | 金额正确，付给 resolvedBy |
| C07 | 维持与撤销报酬 | 完全相同 |
| C08 | 重复结案/重复报酬入账 | 拒绝，不增加 claimable |
| C09 | 管理权转移后领取旧案报酬 | 给旧执行者，不给新 owner |
| C10 | 改判、恢复旧 Work、任意抽押金 | 不存在对应越权入口 |

### 17.5 资金和对抗场景

| 编号 | 场景 | 期望 |
| --- | --- | --- |
| A01 | 多用户交错挂单、购买、撤销、到期、案件、提现 | 每步检查三类资金覆盖与总额 |
| A02 | 买家/卖家是拒收 ETH 的合约 | 业务入账成功；提现失败保留余额 |
| A03 | 恶意收款合约在提现时重入 | 无法重复提取，无资产损失 |
| A04 | 第三方触发结算/奖励 | 无法改变收款人或窃取资金 |
| A05 | 强制转入 ETH | 只有 surplus 增加，不增加可支出账目 |
| A06 | 重复调用所有资金释放接口 | 不重复退款、赔付、发奖 |
| A07 | 多份许可后管理员撤销 | 不依赖遍历；单笔撤销规模基本不随许可数增长 |
| A08 | 分页 limit 0/51、偏移超尾部、极大偏移 | 正确拒绝或空结果，无溢出 |
| A09 | 普通 ETH 转账、不接受的方法附带 ETH | 明确回滚 |

至少加入一个可复现的随机操作序列或属性测试：固定随机种子，多个账户交错交易，每步用测试侧模型汇总锁定押金、余额和费用池，核对链上账本。无需为覆盖率数字写无意义测试。

### 17.6 前端验证

Vitest 最少覆盖：SHA-256 固定向量和原字节一致性、UTF-8 字节限制、金额解析精度、时间边界展示、文件变更竞态处理、错误映射和历史结果汇总。资金预览不依赖测试中硬编码的另一套错误公式。

浏览器验证至少覆盖：

1. 无钱包浏览 Discover、作品详情和查询。
2. 搜索、筛选、空状态、错误状态、移动布局。
3. 文件检查、重复登记提示、文件不被误称为上传保存。
4. 本地合约真实数据能够展示，刷新后不丢失。
5. 完整写入流程至少通过测试钱包适配器做端到端验证；测试适配器只能在测试构建启用，生产构建绝不暴露本地私钥。
6. MetaMask 手动完成至少登记、接受和提现的检查；环境无法操作扩展时明确列为待人工验证，不声称已自动验证扩展。
7. 拒签、RPC 故障、错误网络、无部署配置、切换账户、交易失败能恢复。
8. 页面显示的金额、状态和历史查询与合约一致。

## 18. 实施顺序和里程碑

### M1：业务与工程基线

创建两套独立工程，锁定依赖和 Node；建立类型、常量、错误、标准条款、ABI 导出框架。交付可编译空合约和可启动空前端，不视为任务完成。

### M2：登记与挂单

实现 Work、Offer、索引和字段约束，完成 R/O 测试。确认每单押金独立，取消与过期退押金守恒。

### M3：许可与资金

实现接受、提前撤销、到期结算、提现、预览、历史查询，完成 L/A 核心测试。在本地脚本完整跑一遍资金流。

### M4：案件与费用池

实现案件、违规撤销、独立费用池和补贴，完成 C 测试，特别验证空池也能撤销和到期先后规则。

### M5：前端全流程

实现页面、钱包、格式检查、链读写封装、交易反馈、缓存和历史查询。所有核心按钮连接真实合约，不保留只弹 toast 的假操作。

### M6：联调、样例与交付

生成样例、浏览器核验、修复状态/金额不一致；完成构建、README、部署步骤与验证记录。具备配置时部署 Sepolia；否则准确交付部署准备状态。

每一里程碑通过相关检查后再推进，不反复跑与本次修改无关的全套测试。最终仍需一次完整合约测试和前端生产构建。

## 19. 课堂演示与最终验收

### 19.1 演示账户

- A：平台管理员，费用池出资者。
- B：作品登记人/许可卖家。
- C：许可买家。
- D：另一位买家或旁观者，用于证明公开查询和第三方触发结算。

### 19.2 必须可复现的演示

| 步骤 | 操作 | 应观察到的结果 |
| --- | --- | --- |
| 1 | B 选择文件并登记 | 指纹、时间、登记地址上链，Discover出现卡片 |
| 2 | C 选同文件尝试登记 | 提示已有有效声明；合约也能拒绝绕过前端的重复提交 |
| 3 | B 挂单，P=.001、C=.0002 | 锁定 .0012 ETH |
| 4 | C 支付 .001 接受 | 许可生效；B余额增加 .001，押金仍锁定 |
| 5 | D 无钱包查询 C 在当前时间的许可 | 得到许可范围、起止时间和记录 |
| 6 | 推进到期限中段，B 提前撤销 | C得到剩余退款和固定补偿，可领取；B取回对应剩余押金 |
| 7 | C领取余额 | 钱包到账；许可历史不被删除 |
| 8 | 新许可正常到期，D触发结算 | 许可失效，押金只给B |
| 9 | A录入另一个违规登记案件并撤销 | 新交易被阻止，活跃买家许可终止，可逐份领取 D |
| 10 | 空费用池下结案，再注资发奖 | 案件不受阻；补贴只发一次，来源独立 |
| 11 | 同哈希重新登记并查旧许可 | 新旧关联正确，历史记录仍可查询 |
| 12 | 清空浏览器缓存、刷新 | 业务数据可从链恢复，热门榜来源真实成交 |

### 19.3 第一版完成标准

- 干净环境按 README 可安装、测试、部署本地合约、导出接口、运行前端。
- 合约正常限制下编译和部署成功；所有资金、权限、历史边界测试通过。
- 前端 typecheck、lint、业务测试、生产构建通过，浏览器核验结果有记录。
- 不存在关键业务 TODO、硬编码假余额、模拟成功提示、未接线核心按钮或静默吞错。
- 可独立构建前端，且无 Hardhat 运行时依赖。
- 真实部署信息和 ABI 一致；未部署网络明确说明。
- 账户金额分项与合约一致，不把尚未拨付报酬、尚未结算押金算作可提现。
- 交付真实验证记录，明确区分本地已验证、Sepolia已验证和待人工验证。

## 20. 第一版接受的限制与后续扩展边界

| 限制 | 第一版处理 | 后续才考虑 |
| --- | --- | --- |
| 文件修改即哈希变化 | 明确只做精确字节查重 | 相似度或内容指纹 |
| 假冒先登记 | 平台默认声明，线下处理后撤销 | 身份核验、挑战期、登记担保 |
| 管理员不可信或虚构案件 | 权限和完整记录，固定报酬不等于公正 | 多签、独立审核、报酬审批 |
| 重复假冒重新登记 | 继续按声明与线下处理机制运行 | 指定更正钱包、身份约束 |
| 已到期且押金可释放 | 不承诺永久追偿 | 更长保障期或独立赔偿基金 |
| 已下载作品无法收回 | 只改变许可记录，不承诺删除文件 | 加密交付/DRM也只能改善部分问题 |
| 热度可被多钱包刷量 | 禁止同地址自购，展示统计口径 | 反作弊与独立买家指标 |
| 没有后台索引 | 小规模分页读取，清楚显示加载进度 | 独立可替换索引服务 |
| 管理员补贴不覆盖真实Gas | 明确为固定额度 | relayer或精确报销方案 |

不要为了“以后可能需要”提前引入 NFT、代币、治理、数据库或微服务。未来扩展应围绕清晰接口增量增加。

## 21. 交付给下一个 agent 的任务文本

可直接使用下面的任务描述，并附上本规划书：

> 请完整实现附件《版权声明与押金担保授权 DApp：第一版实施规划书》。先检查当前目录和已有指令，按文档的业务规则实现独立的 Hardhat 3 合约工程和 Vite React 前端工程。核心特色是逐单预存押金、作者提前撤销时按剩余期限退款并支付固定补偿，以及线下裁决后管理员撤销声明、独立费用池支付固定处理报酬。完成合约状态、索引、资金守恒、历史查询、格式检查、Discover、钱包交互、账户提现、管理页、样例数据、自动化测试和部署脚本。前端必须连接真实合约并支持 MetaMask、本地链和 Sepolia。不要仅交付静态页面或脚手架，不改变文档的金额公式和结算边界。按里程碑推进，最终交付可运行代码、简明启动说明和实际验证记录；没有 Sepolia 配置时交付可执行部署流程并如实说明未实际部署。

## 22. 标准许可条款 v1：应用内固定展示文本

实现时保存为 `docs/LICENSE-TERMS-V1.md`，前端同版本正文应与之保持一致。它是本作业的系统规则说明，不能包装成已经由律师审核的通用法律合同。

**版本标识：CopyrightLicenseTerms/v1。**

1. 授权标的是挂单关联 workId 所登记文件哈希对应的作品；登记记录属于权利声明，不构成平台对真实权属的保证。
2. 登记人向接受挂单的钱包授予有期限、非独占、不可转让、不可转授权的使用许可，具体允许的用途以挂单 scope 为准。没有写入 scope 的用途，不由本系统额外推定为已获许可。
3. 许可自接受交易成功的链上时间开始，到记录的 endsAt 时终止；区间包含起点、不包含终点。
4. 买家一次支付挂单价格 P，登记人预先锁定 D = P + C 的押金。用户各自承担提交交易的网络手续费。
5. 登记人可以在许可有效期间主动提前终止，但合约须在同一交易中将剩余期限对应退款 U 加固定补偿 C 记入买家可领取余额。E = floor(P × 已履行秒数 / 总秒数)，U = P − E，剩余押金 E 记入登记人余额。
6. 许可正常到期时，登记人可收回全部押金；实际结算和提现时间不延长许可期限。
7. 如果登记在许可到期前被管理员依线下裁决撤销，该许可从链上撤销时间起终止，尚未结算的该份许可押金 P + C 全部记入买家余额。已经先终止并结算，或在登记撤销前已到期的许可，不重新计算赔偿。
8. 账户余额入账后须由账户持有人发起提现。触发结算者不能修改资金接收人。
9. 管理员处理费用来自独立平台费用池，不从买家的许可退款或该份许可的押金赔偿中扣除。
10. 系统不保存或交付原始作品文件，不控制用户设备，不保证已下载文件被删除，也不自动识别现实使用行为是否符合许可。
11. 同一文件哈希重新登记会生成新声明，旧声明、旧许可和旧资金记录不删除、不自动迁移。
12. 许可查询只说明平台记录，不代替现实权属判断、线下裁决或适用法律。

## 23. 实施参考资料

外部文档用于核对 API 和工具用法，不得覆盖本文业务规则。后续版本可能变化，实施 agent 应以锁定的主版本为准。

- [Hardhat 3 入门](https://hardhat.org/docs/getting-started)
- [Hardhat 3 测试](https://hardhat.org/docs/guides/testing)
- [Hardhat 3 Node 支持](https://hardhat.org/docs/reference/nodejs-support)
- [Wagmi React 入门](https://wagmi.sh/react/getting-started)
- [Wagmi 与 TanStack Query](https://wagmi.sh/react/guides/tanstack-query)
- [Viem 文档](https://viem.sh/)
- [Vite 入门](https://vite.dev/guide/)
- [OpenZeppelin 权限控制](https://docs.openzeppelin.com/contracts/5.x/access-control)
- [OpenZeppelin Utils](https://docs.openzeppelin.com/contracts/5.x/api/utils)
- [WIPO 版权问答](https://www.wipo.int/en/web/copyright/faq-copyright)

版本基线查询来源是各包的 npm registry `/latest` 元数据；实际工程仍须提交锁文件和验证兼容性，不能将本文版本表视为已完成安装测试。
