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

export const offerStatusLabel = (status: number) =>
  ["不存在", "可接受", "已成交", "卖家取消", "已到期", "作品已撤销"][status] ||
  "未知";
export const licenseStatusLabel = (status: number) =>
  ["不存在", "有效", "作者提前撤销", "登记被撤销", "已到期"][status] || "未知";
