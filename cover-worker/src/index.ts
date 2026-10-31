import { createPublicClient, http, isAddress, parseAbi, sha256, verifyMessage, type Address, type Hex } from "viem";
import { sepolia } from "viem/chains";
import { coverMessage, MAX_COVER_BYTES, parseCoverPath, type CoverTarget } from "../../shared/cover-protocol";

export interface Env {
  COVERS: R2Bucket;
  ALLOWED_ORIGINS: string;
  SEPOLIA_RPC_URL: string;
  SEPOLIA_MARKET_ADDRESS: string;
  ENABLE_LOCAL_UPLOADS: string;
  LOCAL_UPLOAD_TOKEN?: string;
}

const workAbi = parseAbi(["function getWork(uint256 id) view returns ((uint256 id, bytes32 fileHash, address registrant, string title, string description, uint8 category, uint8 coverId, uint64 registeredAt, uint64 invalidatedAt, uint256 invalidatedByCaseId, uint256 previousWorkId, uint256 acceptedCount))"]);
const fail = (status: number, code: string) => new Response(code, { status, headers: { "Cache-Control": "no-store" } });

async function authorize(request: Request, env: Env, target: CoverTarget, digest: Hex) {
  const signer = request.headers.get("X-Cover-Signer") || "";
  const signature = request.headers.get("X-Cover-Signature") || "";
  const expires = request.headers.get("X-Cover-Expires") || "";
  const remaining = Number(expires) - Math.floor(Date.now() / 1000);
  if (!isAddress(signer) || !/^0x[\da-f]{130}$/i.test(signature) || !/^\d{10}$/.test(expires) || remaining <= 0 || remaining > 300) return fail(401, "INVALID_SIGNATURE");
  const message = coverMessage(target, new URL(request.url).origin, digest, expires);
  try {
    if (!await verifyMessage({ address: signer, message, signature: signature as Hex })) return fail(401, "INVALID_SIGNATURE");
  } catch { return fail(401, "INVALID_SIGNATURE"); }
  if (target.chainId === 31337) {
    // 云端无法访问访问者电脑的 Hardhat。测试上传使用独立口令，不冒充链上权属验证。
    if (env.ENABLE_LOCAL_UPLOADS !== "true" || !env.LOCAL_UPLOAD_TOKEN || request.headers.get("X-Local-Upload-Token") !== env.LOCAL_UPLOAD_TOKEN) return fail(403, "LOCAL_UPLOAD_DISABLED");
  } else {
    if (!isAddress(env.SEPOLIA_MARKET_ADDRESS) || target.market !== env.SEPOLIA_MARKET_ADDRESS.toLowerCase()) return fail(403, "CONTRACT_NOT_ALLOWED");
    try {
      const client = createPublicClient({ chain: sepolia, transport: http(env.SEPOLIA_RPC_URL, { timeout: 10000, retryCount: 0 }) });
      if (await client.getChainId() !== sepolia.id) return fail(503, "RPC_UNAVAILABLE");
      const work = await client.readContract({ address: target.market as Address, abi: workAbi, functionName: "getWork", args: [BigInt(target.workId)] });
      if (work.registrant.toLowerCase() !== signer.toLowerCase() || work.fileHash.toLowerCase() !== target.fileHash) return fail(403, "NOT_REGISTRANT");
    } catch { return fail(503, "RPC_UNAVAILABLE"); }
  }
}

async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") return new Response("ok");
  const target = parseCoverPath(url.pathname);
  if (!target) return fail(404, "NOT_FOUND");
  const key = url.pathname.slice(1);
  if (request.method === "GET") {
    const object = await env.COVERS.get(key);
    if (!object) return fail(404, "NOT_FOUND");
    return new Response(object.body, { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=86400", ETag: object.httpEtag, "X-Content-Type-Options": "nosniff" } });
  }
  if (request.method !== "PUT") return fail(405, "METHOD_NOT_ALLOWED");
  const origin = request.headers.get("Origin");
  if (!origin || !env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).includes(origin)) return fail(403, "ORIGIN_NOT_ALLOWED");
  if (request.headers.get("Content-Type") !== "image/webp") return fail(415, "WEBP_REQUIRED");
  const length = Number(request.headers.get("Content-Length"));
  if (!Number.isInteger(length) || length < 12 || length > MAX_COVER_BYTES) return fail(413, "COVER_TOO_LARGE");
  // 逐块限制真实大小，不能只相信客户端传来的 Content-Length。
  const reader = request.body?.getReader();
  if (!reader) return fail(400, "INVALID_IMAGE");
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_COVER_BYTES) { await reader.cancel(); return fail(413, "COVER_TOO_LARGE"); }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  const ascii = new TextDecoder("ascii");
  if (size < 20 || ascii.decode(bytes.slice(0, 4)) !== "RIFF" || ascii.decode(bytes.slice(8, 12)) !== "WEBP" || !["VP8 ", "VP8L", "VP8X"].includes(ascii.decode(bytes.slice(12, 16)))) return fail(415, "INVALID_IMAGE");
  const digest = sha256(bytes);
  const denial = await authorize(request, env, target, digest);
  if (denial) return denial;
  // 首次写入后不覆盖，短期签名重放不会替换封面。重复提交可安全重试。
  const result = await env.COVERS.put(key, bytes, { onlyIf: { etagDoesNotMatch: "*" }, httpMetadata: { contentType: "image/webp" } });
  return new Response(result ? "CREATED" : "ALREADY_EXISTS", { status: result ? 201 : 200 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).includes(origin);
    let response: Response;
    try { response = request.method === "OPTIONS" ? new Response(null, { status: allowed ? 204 : 403 }) : await handle(request, env); }
    catch { response = fail(500, "STORAGE_UNAVAILABLE"); }
    const headers = new Headers(response.headers);
    if (allowed) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, X-Cover-Signer, X-Cover-Signature, X-Cover-Expires, X-Local-Upload-Token");
    }
    headers.set("Vary", "Origin");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, { status: response.status, headers });
  },
};
