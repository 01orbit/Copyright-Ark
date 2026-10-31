import { useLanguage } from "../i18n";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Chip } from "@heroui/react";
import { useReadContract } from "wagmi";
import { categories, formatDate, safeReferenceUrl, shorten } from "../domain";
import { abi, useMarket } from "../market";
import {
  EmptyState,
  Facts,
  Notice,
  PageHeading,
  Panel,
} from "../components/ui";
import { WorkLicensing } from "../components/WorkLicensing";

export default function WorkDetail() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const workId = /^\d+$/.test(id) ? BigInt(id) : 0n;
  const { address, chainId } = useMarket();
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

  if (error) return <Notice>{t("作品读取失败，请检查网络。")}</Notice>;
  if (isLoading) return <EmptyState>{t("正在读取作品…")}</EmptyState>;
  if (!work?.id) return <EmptyState>{t("未找到该作品。")}</EmptyState>;
  const referenceUrl = safeReferenceUrl(work.referenceUrl);

  return (
    <div className="space-y-8 pb-12">
      <Button
        size="sm"
        variant="outline"
        onPress={() => navigate("/discover")}
      >
        {t("← 返回发现")}
      </Button>
      <section className="max-w-4xl">
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
          {referenceUrl ? (
            <p className="text-sm">
              <span className="mr-2 text-muted">{t("作品参考链接")}</span>
              <a href={referenceUrl} target="_blank" rel="noopener noreferrer" className="break-all text-accent underline underline-offset-2">
                {work.referenceUrl}
              </a>
            </p>
          ) : work.referenceUrl ? (
            <p className="break-all text-sm text-muted">{t("作品参考链接")}: {work.referenceUrl}</p>
          ) : null}
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
      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title={t("使用许可")}>
          <WorkLicensing key={`${chainId}-${address}-${work.id}`} work={work} />
        </Panel>
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
      </div>
    </div>
  );
}
