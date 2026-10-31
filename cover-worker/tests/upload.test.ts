import { beforeEach, describe, expect, it, vi } from "vitest";
import { sha256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import worker, { type Env } from "../src/index";
import { coverMessage, coverPath, MAX_COVER_BYTES, type CoverTarget } from "../../shared/cover-protocol";

const rpc = vi.hoisted(() => ({ getChainId: vi.fn(), readContract: vi.fn() }));
vi.mock("viem", async (original) => ({ ...await original<typeof import("viem")>(), createPublicClient: () => rpc }));

const account = privateKeyToAccount(`0x${"11".repeat(32)}`);
const origin = "https://ark.example";
const service = "https://covers.example";
const target: CoverTarget = { chainId: 31337, market: `0x${"22".repeat(20)}`, epoch: `0x${"33".repeat(32)}`, workId: "1", fileHash: `0x${"44".repeat(32)}` };
// Minimal WebP header for protocol tests; real image decoding is checked in the browser.
const image = new TextEncoder().encode("RIFF0000WEBPVP8 00000000");
let objects: Map<string, Uint8Array>;
let env: Env;

beforeEach(() => {
  objects = new Map();
  env = {
    ALLOWED_ORIGINS: origin, ENABLE_LOCAL_UPLOADS: "true", LOCAL_UPLOAD_TOKEN: "local-test-only",
    SEPOLIA_MARKET_ADDRESS: target.market, SEPOLIA_RPC_URL: "https://rpc.example",
    COVERS: {
      get: async (key: string) => objects.has(key) ? { body: objects.get(key), httpEtag: '"test"' } : null,
      put: async (key: string, bytes: Uint8Array, options: { onlyIf: { etagDoesNotMatch: string } }) => {
        expect(options.onlyIf.etagDoesNotMatch).toBe("*");
        if (objects.has(key)) return null;
        objects.set(key, bytes);
        return { key };
      },
    } as unknown as R2Bucket,
  };
  rpc.getChainId.mockReset().mockResolvedValue(11155111);
  rpc.readContract.mockReset().mockResolvedValue({ registrant: account.address, fileHash: target.fileHash });
});

async function request(destination = target, bytes = image, overrides: Record<string, string> = {}, seconds = 240) {
  const expires = String(Math.floor(Date.now() / 1000) + seconds);
  const signature = await account.signMessage({ message: coverMessage(destination, service, sha256(bytes), expires) });
  return new Request(service + coverPath(destination), {
    method: "PUT", body: bytes,
    headers: {
      Origin: origin, "Content-Type": "image/webp", "Content-Length": String(bytes.length),
      "X-Cover-Signer": account.address, "X-Cover-Signature": signature,
      "X-Cover-Expires": expires, "X-Local-Upload-Token": "local-test-only", ...overrides,
    },
  });
}

describe("public covers", () => {
  it("stores a signed cover, allows anonymous reads and preserves the first upload", async () => {
    expect((await worker.fetch(await request(), env)).status).toBe(201);
    const next = new Uint8Array(image); next[20] = 1;
    expect((await worker.fetch(await request(target, next), env)).status).toBe(200);
    const result = await worker.fetch(new Request(service + coverPath(target)), env);
    expect(result.status).toBe(200);
    expect(new Uint8Array(await result.arrayBuffer())).toEqual(image);
    expect(result.headers.get("Content-Type")).toBe("image/webp");
  });

  it("isolates local chain restarts, contracts and Sepolia", async () => {
    await worker.fetch(await request(), env);
    for (const other of [
      { ...target, epoch: `0x${"55".repeat(32)}` },
      { ...target, market: `0x${"66".repeat(20)}` },
      { ...target, chainId: 11155111, epoch: "sepolia" },
    ]) expect((await worker.fetch(new Request(service + coverPath(other)), env)).status).toBe(404);
    const missing = await worker.fetch(new Request(service + coverPath({ ...target, workId: "2" })), env);
    expect(missing.headers.get("Cache-Control")).toBe("no-store");
  });

  it("requires an enabled local testing token and an allowed site", async () => {
    expect((await worker.fetch(await request(target, image, { "X-Local-Upload-Token": "wrong" }), env)).status).toBe(403);
    expect((await worker.fetch(await request(), { ...env, ENABLE_LOCAL_UPLOADS: "false" })).status).toBe(403);
    expect((await worker.fetch(await request(target, image, { Origin: "https://other.example" }), env)).status).toBe(403);
    expect(objects.size).toBe(0);
  });

  it("rejects expired signatures and signatures for other bytes, objects or services", async () => {
    expect((await worker.fetch(await request(target, image, {}, -1), env)).status).toBe(401);
    expect((await worker.fetch(await request(target, image, {}, 600), env)).status).toBe(401);
    const signed = await request();
    const headers = Object.fromEntries(signed.headers);
    const changed = new Uint8Array(image); changed[20] = 2;
    expect((await worker.fetch(new Request(signed.url, { method: "PUT", headers, body: changed }), env)).status).toBe(401);
    expect((await worker.fetch(new Request(service + coverPath({ ...target, workId: "2" }), { method: "PUT", headers, body: image }), env)).status).toBe(401);
    expect((await worker.fetch(new Request("https://fake.example" + coverPath(target), { method: "PUT", headers, body: image }), env)).status).toBe(401);
    expect(objects.size).toBe(0);
  });

  it("rejects oversized and disguised files before storing", async () => {
    const large = new Uint8Array(MAX_COVER_BYTES + 1);
    expect((await worker.fetch(await request(target, large), env)).status).toBe(413);
    expect((await worker.fetch(await request(target, large, { "Content-Length": "24" }), env)).status).toBe(413);
    expect((await worker.fetch(await request(target, new TextEncoder().encode("<svg>not a WebP image</svg>")), env)).status).toBe(415);
    expect(objects.size).toBe(0);
  });

  it("handles CORS preflight without disclosing the testing token", async () => {
    const response = await worker.fetch(new Request(service, { method: "OPTIONS", headers: { Origin: origin } }), env);
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(await response.text()).toBe("");
  });
});

describe("Sepolia authorization", () => {
  const sepolia = { ...target, chainId: 11155111, epoch: "sepolia" };
  it("checks the configured contract, actual RPC chain, registrant and file hash", async () => {
    expect((await worker.fetch(await request(sepolia), env)).status).toBe(201);
    expect(rpc.readContract).toHaveBeenCalledWith(expect.objectContaining({ address: target.market, functionName: "getWork", args: [1n] }));
    rpc.readContract.mockResolvedValueOnce({ registrant: `0x${"77".repeat(20)}`, fileHash: target.fileHash });
    expect((await worker.fetch(await request(sepolia), env)).status).toBe(403);
    rpc.readContract.mockResolvedValueOnce({ registrant: account.address, fileHash: `0x${"88".repeat(32)}` });
    expect((await worker.fetch(await request(sepolia), env)).status).toBe(403);
    expect((await worker.fetch(await request(sepolia), { ...env, SEPOLIA_MARKET_ADDRESS: "" })).status).toBe(403);
    rpc.getChainId.mockResolvedValueOnce(31337);
    expect((await worker.fetch(await request(sepolia), env)).status).toBe(503);
    rpc.getChainId.mockRejectedValueOnce(new Error("offline"));
    expect((await worker.fetch(await request(sepolia), env)).status).toBe(503);
  });
});
