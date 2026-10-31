import { useLanguage } from "../i18n";
import { Button, Card, Chip } from "@heroui/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { categories, formatDate, shorten } from "../domain";
import { abi, useMarket } from "../market";
import type { Work } from "../market";
import { EmptyState, Notice, PageHeading } from "../components/ui";
import { WalletButton } from "../components/Layout";
import { OfferModal } from "../components/Offers";

export default function Offers() {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { address: account, isConnected } = useAccount();
  const [selectedWork, setSelectedWork] = useState<Work>();
  const {
    data: workIds,
    isLoading: loadingIds,
    error: idsError,
  } = useReadContract({
    address,
    abi,
    functionName: "getWorkIdsByRegistrant",
    chainId,
    args: [account!, 0n, 50n],
    query: { enabled: !!address && !!account },
  });
  const ids = workIds?.[0] ?? [];
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
  const works = (results ?? []).flatMap((result) =>
    result.result ? [result.result] : [],
  );

  return (
    <>
      <PageHeading title={t("授权挂单")}>
        {isConnected
          ? t("选择自己登记的有效作品，设置许可条件并发布挂单。")
          : t("连接登记作品的钱包，即可为作品创建授权挂单。")}
      </PageHeading>
      {!isConnected ? (
        <div className="max-w-sm rounded-xl border border-border bg-surface p-5">
          <WalletButton />
        </div>
      ) : idsError || worksError ? (
        <Notice>{t("作品读取失败，请检查网络。")}</Notice>
      ) : loadingIds || loadingWorks ? (
        <EmptyState>{t("正在读取作品…")}</EmptyState>
      ) : works.length === 0 ? (
        <EmptyState>
          <div className="space-y-3">
            <p>{t("当前钱包还没有登记作品。")}</p>
            <Link
              to="/register"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-accent bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent/90"
            >
              {t("登记作品")}
            </Link>
          </div>
        </EmptyState>
      ) : (
        <section className="space-y-4" aria-label={t("我的登记作品")}>
          {works.map((work) => (
            <Card
              key={String(work.id)}
              className="gap-0 border border-border bg-surface p-0 shadow-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-5 p-5">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Chip size="sm" variant="soft">
                      {t(categories[work.category])}
                    </Chip>
                    <span>#{String(work.id).padStart(3, "0")}</span>
                    <span>{t("登记于 {date}", { date: formatDate(work.registeredAt, locale) })}</span>
                    <span>{t("登记人")} {shorten(work.registrant)}</span>
                  </div>
                  <h2 className="break-words text-lg font-semibold">{work.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted">
                    {work.description || t("暂无简介")}
                  </p>
                  {work.invalidatedAt && (
                    <p className="text-sm text-danger">{t("已撤销的作品不能创建挂单。")}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    to={`/works/${work.id}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted/20"
                  >
                    {t("查看作品")}
                  </Link>
                  <Button
                    size="sm"
                    isDisabled={!!work.invalidatedAt}
                    onPress={() => setSelectedWork(work)}
                  >
                    {t("创建挂单")}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </section>
      )}
      {selectedWork && (
        <OfferModal work={selectedWork} onClose={() => setSelectedWork(undefined)} />
      )}
    </>
  );
}
