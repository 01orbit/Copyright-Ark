import { useLanguage } from "../i18n";
import { categories } from "../domain";
import { useState } from "react";
import { coverUrl } from "../covers/client";
import { useCoverTarget } from "../covers/useCoverTarget";
import type { Work } from "../market";

const styles = [
  "bg-slate-100 text-slate-500",
  "bg-blue-50 text-blue-600",
  "bg-amber-50 text-amber-700",
  "bg-violet-50 text-violet-600",
  "bg-teal-50 text-teal-700",
  "bg-slate-100 text-slate-500",
];

// 有共享封面时展示真实缩略图；服务未配置、无封面或读取失败时使用小图标。
export default function WorkCover({ category = 0, work, className = "" }: {
  category?: number;
  work?: Pick<Work, "id" | "fileHash">;
  className?: string;
}) {
  const { t } = useLanguage();
  const target = useCoverTarget(work);
  const url = target && coverUrl(target);
  const [failedUrl, setFailedUrl] = useState<string>();
  return (
    <div
      role="img"
      aria-label={url && failedUrl !== url ? t("作品封面") : t("{category}类型示意图 · 非作品原图", { category: t(categories[category] || "其他") })}
      className={`relative overflow-hidden grid place-items-center border border-current/10 ${styles[category] || styles[0]} ${className}`}
    >
      {url && failedUrl !== url && <img src={url} alt="" onError={() => setFailedUrl(url)} className="absolute inset-0 z-10 size-full bg-surface object-contain" loading="lazy" />}
      <svg viewBox="0 0 64 64" fill="none" className="size-24 max-h-[75%] max-w-[75%]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 8h22l10 10v34a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4V12a4 4 0 0 1 2-4Z" fill="white" fillOpacity=".8" />
        <path d="M38 8v10h11" opacity=".45" />
        {category === 1 ? <>
          <rect x="22" y="28" width="20" height="17" rx="3" />
          <circle cx="28" cy="33" r="1.5" fill="currentColor" stroke="none" />
          <path d="m23 43 6-6 4 4 4-5 5 7" />
        </> : category === 2 ? <>
          <path d="M23 29h17M23 36h17M23 43h11" />
        </> : category === 3 ? <>
          <path d="M24 34v6M29 28v18M34 32v10M39 25v24" />
        </> : category === 4 ? <>
          <rect x="22" y="28" width="20" height="17" rx="3" />
          <path d="m30 33 6 4-6 4Z" fill="currentColor" stroke="none" />
        </> : <>
          <rect x="23" y="29" width="6" height="6" rx="1" />
          <rect x="35" y="29" width="6" height="6" rx="1" />
          <rect x="23" y="41" width="6" height="6" rx="1" />
          <rect x="35" y="41" width="6" height="6" rx="1" />
        </>}
      </svg>
    </div>
  );
}
