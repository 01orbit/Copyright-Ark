import { useLanguage } from "../i18n";
import BrandMark from "./BrandMark";

export default function HomeArtwork() {
  const { t } = useLanguage();
  return (
    <div
      className="relative mx-auto w-full max-w-lg p-3 sm:p-8"
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-[2.5rem] bg-accent/[.07]" />
      <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-border bg-surface shadow-xl shadow-foreground/10">
        <svg
          viewBox="0 0 600 480"
          className="absolute inset-0 size-full"
          fill="none"
        >
          <path d="M64 112h472M64 136h224M64 392h472" stroke="#d5dce5" />
          <path
            d="M64 94h88"
            stroke="#3168c5"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="304" cy="255" r="148" fill="#edf4ff" />
          <circle
            cx="304"
            cy="255"
            r="120"
            stroke="#9abcf6"
            strokeDasharray="2 8"
          />
          <circle
            cx="304"
            cy="255"
            r="98"
            stroke="#3168c5"
            strokeOpacity=".28"
          />
          <path
            d="M392 150l64-36v74l-64 36z"
            fill="#3168c5"
            fillOpacity=".08"
          />
          <path
            d="M392 150v74M456 114v74"
            stroke="#3168c5"
            strokeOpacity=".28"
          />
          <rect x="78" y="414" width="118" height="20" rx="10" fill="#f4f6f8" />
          <rect
            x="78"
            y="414"
            width="44"
            height="20"
            rx="10"
            fill="#3168c5"
            fillOpacity=".18"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <BrandMark className="size-24 rounded-[1.65rem] shadow-lg shadow-accent/25" />
        </div>
        <div className="absolute top-7 left-7 flex items-center gap-2 text-[10px] font-semibold tracking-[.22em] text-muted">
          <span className="size-1.5 rounded-full bg-accent" />
          ORIGINAL RECORD
        </div>
        <div className="absolute right-7 bottom-6 text-right text-[10px] tracking-[.18em] text-muted">
          <p>{t("创作 · 登记 · 授权")}</p>
          <p className="mt-1 text-accent">ON CHAIN</p>
        </div>
      </div>
    </div>
  );
}
