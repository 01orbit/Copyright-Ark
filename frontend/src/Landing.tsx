import { useLanguage } from "./i18n";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import Brand from "./components/Brand";
import HomeArtwork from "./components/HomeArtwork";
import LanguageSwitch from "./components/LanguageSwitch";

export default function Landing() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <main className="relative grid min-h-svh items-center px-6 py-20 sm:px-12">
      <div className="absolute top-6 right-6 sm:right-12">
        <LanguageSwitch />
      </div>
      <section
        className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2 lg:gap-20"
        aria-label={t("Copyright Ark · 版权管理平台")}
      >
        <div className="space-y-7">
          <Brand />
          <h1 className="text-4xl leading-[1.15] font-medium tracking-tight lg:text-5xl xl:text-6xl">
            {t("作品是你的，")}
            <br />
            <span className="text-accent">{t("授权也由你决定。")}</span>
          </h1>
          <div className="max-w-sm space-y-2 text-base leading-relaxed text-muted">
            <p>{t("登记作品、设置授权条件、查询使用记录。")}</p>
            <p>{t("连接钱包就能开始，原文件留在你手里。")}</p>
          </div>
          <Button
            size="lg"
            className="gap-6 px-8"
            onPress={() => navigate("/discover")}
          >
            {t("进入")}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12h16m-6-6 6 6-6 6" />
            </svg>
          </Button>
        </div>
        <HomeArtwork />
      </section>
    </main>
  );
}
