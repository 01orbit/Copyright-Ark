// 浏览器与 Worker 共用：对象地址、签名内容和上传限制。
export const MAX_COVER_BYTES = 192 * 1024;
export type CoverTarget = {
  chainId: number;
  market: string;
  epoch: string;
  workId: string;
  fileHash: string;
};

export function coverPath(target: CoverTarget) {
  return `/covers/${target.chainId}/${target.market.toLowerCase()}/${target.epoch.toLowerCase()}/${target.workId}/${target.fileHash.toLowerCase()}.webp`;
}

export function parseCoverPath(path: string): CoverTarget | undefined {
  const match = /^\/covers\/(31337|11155111)\/(0x[\da-f]{40})\/(sepolia|0x[\da-f]{64})\/([1-9]\d{0,76})\/(0x[\da-f]{64})\.webp$/.exec(path);
  if (!match || (match[1] === "11155111" && match[3] !== "sepolia") || (match[1] === "31337" && match[3] === "sepolia")) return;
  return { chainId: Number(match[1]), market: match[2], epoch: match[3], workId: match[4], fileHash: match[5] };
}

export function coverMessage(target: CoverTarget, audience: string, digest: string, expires: string) {
  return ["Copyright Ark: publish public cover", `Service: ${audience}`, `Object: ${coverPath(target)}`, `Cover SHA-256: ${digest}`, `Expires: ${expires}`, "This message does not authorize a blockchain transaction."].join("\n");
}
