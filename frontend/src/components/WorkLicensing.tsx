import { Button, Chip, Modal, useOverlayState } from "@heroui/react";
import { useState } from "react";
import { formatDate, formatDuration, formatEth, licenseStatusLabel, offerStatusLabel, shorten } from "../domain";
import { useWorkRecords } from "../hooks/useWorkRecords";
import { useLanguage } from "../i18n";
import type { Offer, Work } from "../market";
import { CompactList } from "./CompactList";
import { OfferCard } from "./Offers";
import { EmptyState, FormSelect, Notice } from "./ui";

export function WorkLicensing({ work }: { work: Work }) {
  const { t, locale } = useLanguage();
  const { offers, licenses, loading, error } = useWorkRecords(work.id);
  const [selected, setSelected] = useState<Offer>();
  const [duration, setDuration] = useState("all");
  const modal = useOverlayState({
    isOpen: !!selected,
    onOpenChange: (open) => { if (!open) setSelected(undefined); },
  });
  const available = offers.filter(({ status }) => status === 1);
  const durations = [...new Set(available.map(({ offer }) => String(offer.duration)))].sort((a, b) => Number(a) - Number(b));
  const priceGroup = (price: bigint) => price < 1000000000000000n ? "low" : price <= 2000000000000000n ? "medium" : "high";
  const history = offers.filter(({ status }) => status !== 1);
  const newestFirst = <T extends { id: bigint }>(a: T, b: T) => a.id > b.id ? -1 : 1;
  const offerList = (items: typeof offers, canAccept: boolean) => (
    <CompactList
      items={[...items].sort((a, b) => newestFirst(a.offer, b.offer))}
      getKey={({ offer }) => String(offer.id)}
      getStatus={({ offer, status }) => canAccept ? priceGroup(offer.price) : String(status)}
      getSearchText={({ offer }) => `${offer.id} ${offer.scope}`}
      statusOptions={canAccept ? [
        { value: "low", label: "< 0.001 ETH" },
        { value: "medium", label: "0.001–0.002 ETH" },
        { value: "high", label: "> 0.002 ETH" },
      ] : [2, 3, 4, 5].map((status) => ({ value: String(status), label: t(offerStatusLabel(status)) }))}
      filterLabel={canAccept ? "按价格筛选" : "按状态筛选"}
      allLabel={canAccept ? "全部价格" : "全部状态"}
      searchLabel="搜索挂单编号或使用范围"
      emptyMessage="没有符合条件的挂单。"
      renderItem={({ offer, status }) => (
        <article className="rounded-xl border border-border px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{formatEth(offer.price, locale)} ETH</strong>
              <span className="text-muted">#{String(offer.id)} · {formatDuration(offer.duration, locale)}</span>
              <Chip size="sm" variant="soft">{t(offerStatusLabel(Number(status)))}</Chip>
            </div>
            {canAccept && <Button size="sm" variant="outline" onPress={() => setSelected(offer)}>{t("查看条款并接单")}</Button>}
          </div>
          <p className="mt-1 truncate text-xs text-muted" title={offer.scope}>{offer.scope}</p>
        </article>
      )}
    />
  );

  if (error) return <Notice>{t("挂单读取失败，请检查网络。")}</Notice>;
  if (loading) return <EmptyState>{t("正在读取挂单…")}</EmptyState>;
  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-label={t("可接受的挂单")}>
        <h3 className="font-semibold">{t("可接受的挂单")}</h3>
        <p className="text-sm leading-relaxed text-muted">
          {t("同一作品可向多人非独占授权。每笔挂单限一人接受，作者须为每份许可分别锁定押金；已售出的挂单不能重复购买。")}
        </p>
        {!!available.length && <FormSelect
          label={t("按许可期限筛选")}
          value={duration}
          onChange={setDuration}
          className="w-full sm:w-52"
          options={[{ value: "all", label: t("全部期限") }, ...durations.map((value) => ({ value, label: formatDuration(BigInt(value), locale) }))]}
        />}
        {available.length ? offerList(available.filter(({ offer }) => duration === "all" || String(offer.duration) === duration), true) : <EmptyState>{t("暂无可接受的授权挂单。")}</EmptyState>}
      </section>
      <section className="space-y-3 border-t border-border pt-5" aria-label={t("已签发许可")}>
        <h3 className="font-semibold">{t("已签发许可")}</h3>
        {licenses.length ? <CompactList
          items={[...licenses].sort((a, b) => newestFirst(a.license, b.license))}
          getKey={({ license }) => String(license.id)}
          getStatus={({ status }) => String(status)}
          getSearchText={({ license }) => `${license.id} ${license.licensee}`}
          statusOptions={[1, 2, 3, 4].map((status) => ({ value: String(status), label: t(licenseStatusLabel(status)) }))}
          searchLabel="搜索许可编号或钱包"
          emptyMessage="没有符合条件的许可。"
          renderItem={({ license, status }) => (
            <article className="rounded-xl border border-border px-3 py-2.5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{t("许可 #{id}", { id: String(license.id) })}</strong>
                <span className="font-mono text-xs text-muted" title={license.licensee}>{shorten(license.licensee)}</span>
                <Chip size="sm" variant="soft">{t(licenseStatusLabel(Number(status)))}</Chip>
              </div>
              <p className="mt-1 text-xs text-muted">{formatDate(license.startsAt, locale)} — {formatDate(license.endsAt, locale)}</p>
            </article>
          )}
        /> : <p className="text-sm text-muted">{t("尚无已签发许可。")}</p>}
      </section>
      <details className="border-t border-border pt-4">
        <summary className="cursor-pointer text-sm font-medium">{t("挂单历史（{count}）", { count: history.length })}</summary>
        <div className="pt-3">{offerList(history, false)}</div>
      </details>
      {selected && <Modal isOpen={modal.isOpen} onOpenChange={modal.setOpen}>
        <Modal.Backdrop isDismissable={false}>
          <Modal.Container placement="center" scroll="inside" size="lg">
            <Modal.Dialog className="border border-border bg-surface">
              <Modal.Header><Modal.Heading>{t("挂单 #{id}", { id: String(selected.id) })}</Modal.Heading></Modal.Header>
              <Modal.Body>
                <OfferCard key={String(selected.id)} offer={selected} work={work} onClose={modal.close} />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>}
    </div>
  );
}
