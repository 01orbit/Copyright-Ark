import { useLanguage } from "../i18n";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Chip } from "@heroui/react";
import { useReadContract, useReadContracts } from "wagmi";
import { categories, formatDate, shorten } from "../domain";
import { abi, useMarket } from "../market";
import {
  EmptyState,
  Facts,
  Notice,
  PageHeading,
  Panel,
} from "../components/ui";
import { OfferCard, OfferModal } from "../components/Offers";
import WorkCover from "../components/WorkCover";
import CoverUpload from "../components/CoverUpload";

export default function WorkDetail() {
  const { t, locale } = useLanguage();
  const { id = "" } = useParams();
  const workId = /^\d+$/.test(id) ? BigInt(id) : 0n;
  const { address, chainId } = useMarket();
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [coverVersion, setCoverVersion] = useState(0);
  const {
    data: work,
    isLoading,
    error,
  } = useReadContract({
    address,
    abi,
    functionName: "getWork",
    chainId,
    args: [workId],
    query: { enabled: !!address && workId > 0n },
  });
  const { data: offerIds } = useReadContract({
    address,
    abi,
    functionName: "getOfferIdsByWork",
    chainId,
    args: [workId, 0n, 50n],
    query: { enabled: !!address && workId > 0n },
  });
  const ids = offerIds?.[0] ?? [];
  const {
    data: results,
    isLoading: loadingOffers,
    error: offersError,
  } = useReadContracts({
    contracts: ids.map(
      (id) =>
        ({
          address: address!,
          abi,
          functionName: "getOffer",
          chainId,
          args: [id],
        }) as const,
    ),
    query: { enabled: !!address && ids.length > 0 },
  });
  const offers = (results ?? []).flatMap((result) =>
    result.result ? [result.result] : [],
  );

  if (error) return <Notice>{t("作品读取失败，请检查网络。")}</Notice>;
  if (isLoading) return <EmptyState>{t("正在读取作品…")}</EmptyState>;
  if (!work?.id) return <EmptyState>{t("未找到该作品。")}</EmptyState>;

  return (
    <>
      <Link className="link text-sm text-muted" to="/discover">
        {t("← 返回发现")}
      </Link>
      <section className="grid items-start gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-10">
        <WorkCover key={`${chainId}:${address}:${id}:${coverVersion}`} work={work} category={work.category} className="aspect-[4/3] w-full rounded-2xl" />
        <div className="min-w-0 w-full space-y-5">
          <div className="flex flex-wrap gap-2">
            <Chip variant="soft" size="sm">
              {t(categories[work.category])}
            </Chip>
            <Chip
              color={work.invalidatedAt ? "danger" : "success"}
              variant="soft"
              size="sm"
            >
              {work.invalidatedAt ? t("已撤销") : t("有效登记")}
            </Chip>
          </div>
          <p className="font-mono text-xs tracking-widest text-muted">
            {t("作品档案 /")}
            {String(work.id).padStart(3, "0")}
          </p>
          <PageHeading title={work.title}>
            {work.description || t("暂无简介")}
          </PageHeading>
          <div className="flex items-center gap-3 border-t border-border/60 pt-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/10 font-serif text-lg text-accent">
              ©
            </span>
            <div className="space-y-1">
              <p className="text-xs text-muted">{t("登记人")}</p>
              <p className="font-mono text-sm" title={work.registrant}>
                {shorten(work.registrant)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-medium">
                {String(work.acceptedCount)}
              </p>
              <p className="text-xs text-muted">{t("累计授权")}</p>
            </div>
          </div>
          <p className="text-xs leading-6 text-muted">
            {t("登记于 {date}", {
              date: formatDate(work.registeredAt, locale),
            })}
            <br />
            {t("平台仅保存文件指纹，不保存或交付原始文件。")}
          </p>
        </div>
      </section>
      <CoverUpload key={`${chainId}:${address}:${id}`} work={work} onUploaded={() => setCoverVersion((value) => value + 1)} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.5fr]">
        <Panel title={t("链上存证")}>
          <Facts
            items={[
              [t("作品编号"), `#${work.id}`],
              [t("登记人"), <code className="text-xs">{work.registrant}</code>],
              [
                t("前一登记"),
                work.previousWorkId ? `#${work.previousWorkId}` : t("首次登记"),
              ],
              [
                t("文件 SHA-256"),
                <code className="text-xs">{work.fileHash}</code>,
              ],
            ]}
          />
        </Panel>
        <Panel title={t("使用许可")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {t("选择固定条款的授权挂单。")}
            </p>
            {!work.invalidatedAt && (
              <Button
                size="sm"
                variant="outline"
                onPress={() => setShowOfferForm(true)}
              >
                {t("创建挂单")}
              </Button>
            )}
          </div>
          {offersError ? (
            <Notice>{t("挂单读取失败，请检查网络。")}</Notice>
          ) : loadingOffers ? (
            <EmptyState>{t("正在读取挂单…")}</EmptyState>
          ) : offers.length ? (
            offers.map((offer) => (
              <OfferCard key={String(offer.id)} offer={offer} work={work} />
            ))
          ) : (
            <EmptyState>{t("暂无挂单，登记人可以创建使用许可。")}</EmptyState>
          )}
        </Panel>
      </div>
      {showOfferForm && (
        <OfferModal work={work} onClose={() => setShowOfferForm(false)} />
      )}
    </>
  );
}
