import { useLanguage } from "../i18n";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Chip } from "@heroui/react";
import { useReadContract, useReadContracts } from "wagmi";
import { categories, formatDate, safeReferenceUrl, shorten } from "../domain";
import { abi, useMarket } from "../market";
import {
  CheckField,
  EmptyState,
  FormInput,
  Notice,
  PageHeading,
} from "../components/ui";

export default function Discover() {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(0);
  const [includeInvalid, setIncludeInvalid] = useState(false);
  const { data, isLoading, error } = useReadContract({
    address,
    abi,
    functionName: "getWorkIds",
    chainId,
    args: [0n, 50n],
    query: { enabled: !!address },
  });
  const ids = data?.[0] ?? [];
  const {
    data: results,
    isLoading: loadingWorks,
    error: worksError,
  } = useReadContracts({
    contracts: ids.map(
      (id) =>
        ({
          address: address!,
          abi,
          functionName: "getWork",
          chainId,
          args: [id],
        }) as const,
    ),
    query: { enabled: !!address && ids.length > 0 },
  });
  const works = (results ?? [])
    .flatMap((result) => (result.result ? [result.result] : []))
    .filter(
      (work) =>
        (includeInvalid || !work.invalidatedAt) &&
        work.title.toLowerCase().includes(search.trim().toLowerCase()) &&
        (!category || work.category === category),
    )
    .sort((a, b) => Number(b.registeredAt) - Number(a.registeredAt));

  return (
    <>
      <PageHeading title={t("发现作品")}>
        {t("浏览原创记录，找到适合你的使用许可。")}
      </PageHeading>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={t("作品类别")}
        >
          {categories.map((name, index) => (
            <Button
              key={index}
              size="sm"
              variant={category === index ? "primary" : "outline"}
              aria-pressed={category === index}
              onPress={() => setCategory(index)}
            >
              {t(name || "全部作品")}
            </Button>
          ))}
        </div>
        <FormInput
          className="w-full sm:w-64"
          aria-label={t("搜索作品标题")}
          placeholder={t("搜索作品标题…")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-5 text-xs text-muted">
        <span>
          {t("最新登记")}{" "}
          <span className="ml-2 text-foreground">
            {works.length} {t("件作品")}
          </span>
        </span>
        <CheckField isSelected={includeInvalid} onChange={setIncludeInvalid}>
          {t("包含已撤销")}
        </CheckField>
      </div>
      {error || worksError ? (
        <Notice>{t("读取失败，请检查网络和 RPC。")}</Notice>
      ) : isLoading || loadingWorks ? (
        <EmptyState>{t("正在读取作品…")}</EmptyState>
      ) : !works.length ? (
        <EmptyState>{t("暂无匹配作品，请调整搜索词或类别。")}</EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => {
            const referenceUrl = safeReferenceUrl(work.referenceUrl);
            return (
              <Card key={String(work.id)} className="min-w-0 gap-0 overflow-hidden border border-border p-0 shadow-none transition-shadow hover:shadow-lg hover:shadow-accent/10">
                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted">
                    <Chip size="sm" variant="soft">{t(categories[work.category])}</Chip>
                    <span className="font-mono">#{String(work.id).padStart(3, "0")}</span>
                  </div>
                  <h2 className="truncate text-lg font-semibold">
                    <Link to={`/works/${work.id}`} className="transition-colors hover:text-accent">{work.title}</Link>
                  </h2>
                  <p className="line-clamp-2 min-h-10 break-words text-sm leading-5 text-muted">
                    {work.description || t("暂无简介")}
                  </p>
                  {referenceUrl && (
                    <a
                      href={referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-accent underline underline-offset-2"
                    >
                      {t("打开参考链接")} ↗
                    </a>
                  )}
                  <div className="flex items-center justify-between border-t border-border/50 pt-4 text-xs">
                    <span className="text-muted">
                      {shorten(work.registrant)}
                    </span>
                    <span
                      className={
                        work.invalidatedAt ? "text-danger" : "text-accent"
                      }
                    >
                      {work.invalidatedAt
                        ? t("已撤销")
                        : t("{count} 次授权", { count: work.acceptedCount })}
                    </span>
                  </div>
                  <time className="block text-xs text-muted">
                    {formatDate(work.registeredAt, locale)}
                  </time>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
