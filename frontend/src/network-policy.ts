export type SupportedChainId = 31337 | 11155111;

// Pages 构建标记兼容自定义域名；主机名检查也保护直接上传的静态构建。
export function canUseLocalChain(hostname: string, cloudflareBuild = false) {
  if (cloudflareBuild) return false;
  return /^(localhost|.+\.localhost|127(?:\.\d{1,3}){3}|\[?::1\]?)$/i.test(hostname)
    || /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(hostname);
}

export function resolveChain(
  requested: number,
  localAllowed: boolean,
): SupportedChainId {
  return localAllowed && requested === 31337 ? 31337 : 11155111;
}
