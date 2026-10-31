import { formatEther, parseEther, sha256 } from "viem";

export const categories = ["", "图片", "文本", "音频", "视频", "其他"];
export const shorten = (address?: string) =>
  address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "—";
export const utf8Bytes = (text: string) =>
  new TextEncoder().encode(text).length;
export const formatDate = (seconds?: bigint | number, locale = "zh-CN") =>
  seconds
    ? new Date(Number(seconds) * 1000).toLocaleString(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export function formatEth(value?: bigint, locale = "zh-CN") {
  if (value === undefined) return "—";
  const [whole, fraction = ""] = formatEther(value).split(".");
  const decimals = fraction.slice(0, 6).replace(/0+$/, "");
  const integer = Number(whole).toLocaleString(locale);
  return decimals ? `${integer}.${decimals}` : integer;
}

export function formatDuration(seconds: bigint, locale: string) {
  const [unit, length]: [string, number] = seconds >= 86400n ? ["day", 86400]
    : seconds >= 3600n ? ["hour", 3600] : ["minute", 60];
  return new Intl.NumberFormat(locale, {
    style: "unit", unit, unitDisplay: "long", maximumFractionDigits: 1,
  }).format(Number(seconds) / length);
}

export function parseEthSafe(value: string) {
  try {
    return parseEther(value || "0");
  } catch {
    return 0n;
  }
}

export async function hashFile(file: File) {
  return sha256(new Uint8Array(await file.arrayBuffer()));
}

export function validateFile(file?: File) {
  if (!file) return "请选择作品文件";
  if (!file.size) return "文件不能为空";
  if (file.size > 20 * 1024 * 1024) return "文件不能超过 20 MiB";
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowed = [
    "png",
    "jpg",
    "jpeg",
    "webp",
    "txt",
    "pdf",
    "mp3",
    "wav",
    "mp4",
  ];
  return extension && allowed.includes(extension) ? "" : "暂不支持该文件格式";
}

export function validateReferenceUrl(value: string) {
  if (!value.trim()) return "";
  const normalized = normalizeReferenceUrl(value);
  if (!normalized || normalized.length > 256) return "参考链接须为有效的 HTTP(S) 地址，且不超过 256 个字符";
  return "";
}

export function normalizeReferenceUrl(value: string) {
  if (!value.trim()) return "";
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return undefined;
    return parsed.href;
  } catch {
    return undefined;
  }
}

export function safeReferenceUrl(value: string) {
  const normalized = normalizeReferenceUrl(value);
  return normalized && normalized.length <= 256 ? normalized : undefined;
}

export const offerStatusLabel = (status: number) =>
  ["不存在", "可接受", "已成交", "卖家取消", "已到期", "作品已撤销"][status] ||
  "未知";
export const licenseStatusLabel = (status: number) =>
  ["不存在", "有效", "作者提前撤销", "登记被撤销", "已到期"][status] || "未知";
