import { sha256, type Address, type Hex } from "viem";
import { coverMessage, coverPath, type CoverTarget } from "../../../shared/cover-protocol";

export const coverApi = (import.meta.env.VITE_COVER_API_URL || "").replace(/\/$/, "");
export const coverUrl = (target: CoverTarget) => coverApi ? `${coverApi}${coverPath(target)}` : undefined;
export const localTokenKey = "copyright-ark:local-cover-token";

// 原文件不缓存；短期草稿只保存当前登记的缩略图，上传失败后可在详情页重试。
const drafts = new Map<string, Blob>();
export const setCoverDraft = (hash: string, blob: Blob) => { drafts.clear(); drafts.set(hash, blob); };
export const getCoverDraft = (hash: string) => drafts.get(hash);
export const clearCoverDraft = (hash: string) => drafts.delete(hash);

export async function uploadCover(target: CoverTarget, blob: Blob, account: Address, sign: (message: string) => Promise<Hex>) {
  const url = coverUrl(target);
  if (!url) throw new Error("封面服务尚未配置，当前使用类型示意图。");
  const digest = sha256(new Uint8Array(await blob.arrayBuffer()));
  const expires = String(Math.floor(Date.now() / 1000) + 240);
  const localToken = target.chainId === 31337 ? sessionStorage.getItem(localTokenKey) : undefined;
  if (target.chainId === 31337 && !localToken) throw new Error("请先在开发者菜单填写本地封面上传口令。");
  const signature = await sign(coverMessage(target, new URL(url).origin, digest, expires));
  const response = await fetch(url, {
    method: "PUT", body: blob,
    headers: {
      "Content-Type": "image/webp", "X-Cover-Signer": account,
      "X-Cover-Signature": signature, "X-Cover-Expires": expires,
      ...(localToken ? { "X-Local-Upload-Token": localToken } : {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const code = await response.text();
    if (code === "LOCAL_UPLOAD_DISABLED") throw new Error("本地封面上传未启用或口令不正确。");
    if (code === "NOT_REGISTRANT") throw new Error("只有链上登记人可以上传封面。");
    throw new Error("封面上传失败，请检查服务配置、网络和钱包签名后重试。");
  }
  clearCoverDraft(target.fileHash);
}
