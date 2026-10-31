import { useLanguage } from "../i18n";

export default function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      role="group"
      aria-label="语言 / Language"
      className="flex shrink-0 rounded-full border border-border bg-surface p-1 text-xs"
    >
      {(
        [
          ["en", "EN"],
          ["zh", "中"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          lang={value === "zh" ? "zh-CN" : "en"}
          aria-label={value === "zh" ? "切换为中文" : "Switch to English"}
          aria-pressed={language === value}
          onClick={() => setLanguage(value)}
          className={`cursor-pointer rounded-full px-2.5 py-1.5 transition-colors ${language === value ? "bg-foreground text-white" : "text-muted hover:bg-background"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
