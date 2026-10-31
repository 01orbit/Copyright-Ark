import { useLanguage } from "../i18n";
import { Button, Card, Chip, Modal, useOverlayState } from "@heroui/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { categories, formatDate, formatEth, offerStatusLabel, shorten } from "../domain";
import { abi, useMarket, useTransaction } from "../market";
import type { Offer, Work } from "../market";
import { EmptyState, Notice, PageHeading } from "../components/ui";
import { WalletButton } from "../components/Layout";
import { OfferModal } from "../components/Offers";

export default function Offers() {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { address: account, isConnected } = useAccount();
  const [selectedWork, setSelectedWork] = useState<Work>();
  const {
    data: offerIds,
    isLoading: loadingOfferIds,
    error: offerIdsError,
  } = useReadContract({
    address,
    abi,
    functionName: "getOfferIdsBySeller",
    chainId,
    args: [account!, 0n, 50n],
    query: { enabled: !!address && !!account },
  });
  const sellerOfferIds = offerIds?.[0] ?? [];
  const {
    data: offerResults,
    isLoading: loadingOffers,
    error: offersError,
  } = useReadContracts({
    contracts: sellerOfferIds.map(
      (id) => ({ address: address!, abi, functionName: "getOffer", chainId, args: [id] }) as const,
    ),
    query: { enabled: !!address && sellerOfferIds.length > 0 },
  });
  const offers = (offerResults ?? []).flatMap((result) =>
    result.result ? [result.result] : [],
  );
  const {
    data: workIds,
    isLoading: loadingWorkIds,
    error: workIdsError,
  } = useReadContract({
    address,
    abi,
    functionName: "getWorkIdsByRegistrant",
    chainId,
    args: [account!, 0n, 50n],
    query: { enabled: !!address && !!account },
  });
  const registrantWorkIds = workIds?.[0] ?? [];
  const {
    data: workResults,
    isLoading: loadingWorks,
    error: worksError,
  } = useReadContracts({
    contracts: registrantWorkIds.map(
      (id) => ({ address: address!, abi, functionName: "getWork", chainId, args: [id] }) as const,
    ),
    query: { enabled: !!address && registrantWorkIds.length > 0 },
  });
  const works = (workResults ?? []).flatMap((result) =>
    result.result ? [result.result] : [],
  );
  const acceptedOffers = offers.filter((offer) => offer.licenseId > 0n);
  const readError = offerIdsError || offersError || workIdsError || worksError;

  return (
    <>
      <PageHeading title={t("个人挂单")}>
        {t("管理自己发布的挂单，并处理已签发许可。")}
      </PageHeading>
      {!isConnected ? (
        <div className="max-w-sm rounded-xl border border-border bg-surface p-5">
          <WalletButton />
        </div>
      ) : readError ? (
        <Notice>{t("作品读取失败，请检查网络。")}</Notice>
      ) : loadingOfferIds || loadingOffers || loadingWorkIds || loadingWorks ? (
        <EmptyState>{t("正在读取作品…")}</EmptyState>
      ) : (
        <div className="space-y-10">
          <section className="space-y-4" aria-label={t("我发布的挂单")}>
            <h2 className="text-xl font-semibold">{t("我发布的挂单")}</h2>
            {offers.length ? (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <ManagedOffer key={String(offer.id)} offer={offer} />
                ))}
              </div>
            ) : (
              <EmptyState>{t("你还没有发布挂单。")}</EmptyState>
            )}
          </section>

          <section className="space-y-4" aria-label={t("我签发的许可")}>
            <h2 className="text-xl font-semibold">{t("我签发的许可")}</h2>
            {acceptedOffers.length ? (
              <div className="space-y-3">
                {acceptedOffers.map((offer) => (
                  <ManagedLicense key={String(offer.licenseId)} offer={offer} />
                ))}
              </div>
            ) : (
              <EmptyState>{t("尚无通过挂单签发的许可。")}</EmptyState>
            )}
          </section>

          <section className="space-y-4" aria-label={t("我的登记作品")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{t("我的登记作品")}</h2>
              <Link to="/register" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted/20">
                {t("登记作品")}
              </Link>
            </div>
            {works.length ? (
              <div className="space-y-3">
                {works.map((work) => (
                  <Card key={String(work.id)} className="gap-0 border border-border bg-surface p-0 shadow-none">
                    <div className="flex flex-wrap items-center justify-between gap-5 p-5">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <Chip size="sm" variant="soft">{t(categories[work.category])}</Chip>
                          <span>#{String(work.id).padStart(3, "0")}</span>
                          <span>{t("登记于 {date}", { date: formatDate(work.registeredAt, locale) })}</span>
                        </div>
                        <h3 className="break-words text-lg font-semibold">{work.title}</h3>
                        <p className="line-clamp-2 text-sm text-muted">{work.description || t("暂无简介")}</p>
                        {work.invalidatedAt && <p className="text-sm text-danger">{t("已撤销的作品不能创建挂单。")}</p>}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Link to={`/works/${work.id}`} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted/20">
                          {t("查看作品")}
                        </Link>
                        <Button size="sm" isDisabled={!!work.invalidatedAt} onPress={() => setSelectedWork(work)}>
                          {t("创建挂单")}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState>
                <div className="space-y-3">
                  <p>{t("当前钱包还没有登记作品。")}</p>
                  <Link to="/register" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-accent bg-accent px-4 text-sm font-medium text-white hover:bg-accent/90">
                    {t("登记作品")}
                  </Link>
                </div>
              </EmptyState>
            )}
          </section>
        </div>
      )}
      {selectedWork && <OfferModal work={selectedWork} onClose={() => setSelectedWork(undefined)} />}
    </>
  );
}

function ManagedOffer({ offer }: { offer: Offer }) {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { writeContractAsync } = useWriteContract();
  const transaction = useTransaction();
  const { data: status } = useReadContract({
    address,
    abi,
    functionName: "getOfferStatus",
    chainId,
    args: [offer.id],
    query: { enabled: !!address },
  });
  return (
    <Card className="gap-3 border border-border bg-surface p-5 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{t("作品 #{id}", { id: String(offer.workId) })} · {formatEth(offer.price, locale)} ETH</p>
          <p className="mt-1 text-sm text-muted">{t("期限 {days} 天 · 锁定押金 {amount} ETH", { days: Number(offer.duration) / 86400, amount: formatEth(offer.price + offer.compensation, locale) })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="soft">{status === undefined ? t("读取中") : t(offerStatusLabel(Number(status)))}</Chip>
          <Button
            size="sm"
            variant="outline"
            className="border-danger text-danger"
            isDisabled={Number(status) !== 1 || transaction.busy}
            onPress={() => address && transaction.run(() => writeContractAsync({ address, abi, functionName: "cancelOffer", chainId, args: [offer.id] }))}
          >
            {transaction.busy ? t("处理中…") : t("撤销挂单")}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted">{t("撤销后，锁定的价格和补偿将计入可领取余额。")}</p>
      <Notice>{transaction.message}</Notice>
    </Card>
  );
}

function ManagedLicense({ offer }: { offer: Offer }) {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { writeContractAsync } = useWriteContract();
  const transaction = useTransaction();
  const [confirming, setConfirming] = useState(false);
  const modal = useOverlayState({ isOpen: confirming, onOpenChange: setConfirming });
  const { data: license } = useReadContract({
    address,
    abi,
    functionName: "getLicense",
    chainId,
    args: [offer.licenseId],
    query: { enabled: !!address },
  });
  const { data: status } = useReadContract({
    address,
    abi,
    functionName: "getLicenseStatus",
    chainId,
    args: [offer.licenseId],
    query: { enabled: !!address },
  });
  const { data: preview } = useReadContract({
    address,
    abi,
    functionName: "previewAuthorRevoke",
    chainId,
    args: [offer.licenseId],
    query: { enabled: !!address && Number(status) === 1 },
  });
  const active = Number(status) === 1;

  async function revoke() {
    if (!address || !active) return;
    const success = await transaction.run(() => writeContractAsync({
      address,
      abi,
      functionName: "revokeLicense",
      chainId,
      args: [offer.licenseId],
    }));
    if (success) setConfirming(false);
  }

  if (!license) return null;
  return (
    <Card className="gap-3 border border-border bg-surface p-5 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{t("作品 #{id} · 许可 #{licenseId}", { id: String(license.workId), licenseId: String(license.id) })}</p>
          <p className="mt-1 text-sm text-muted">{t("被授权钱包：")}<span className="font-mono">{shorten(license.licensee)}</span></p>
          <p className="text-sm text-muted">{t("许可期限：{start} 至 {end}", { start: formatDate(license.startsAt, locale), end: formatDate(license.endsAt, locale) })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="soft">{t(status === undefined ? "读取中" : status === 1 ? "有效" : status === 2 ? "作者提前撤销" : status === 3 ? "登记被撤销" : "已到期")}</Chip>
          {active && <Button size="sm" variant="outline" className="border-danger text-danger" onPress={() => setConfirming(true)}>{t("提前撤销授权")}</Button>}
        </div>
      </div>
      {active && preview && <p className="text-sm text-muted">{t("现在撤销时：买家获 {refund} ETH 剩余退款 + {compensation} ETH 固定补偿；你获得 {seller} ETH 已履约收入。", { refund: formatEth(preview[0] - offer.compensation, locale), compensation: formatEth(offer.compensation, locale), seller: formatEth(preview[1], locale) })}</p>}
      <Notice>{transaction.message}</Notice>
      <Modal isOpen={modal.isOpen} onOpenChange={modal.setOpen}>
        <Modal.Backdrop isDismissable={!transaction.busy}>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog className="border border-border bg-surface">
              <Modal.Header><Modal.Heading>{t("确认提前撤销授权？")}</Modal.Heading></Modal.Header>
              <Modal.Body className="space-y-3 text-sm">
                <p>{t("此操作会立即终止许可且不可恢复。")}</p>
                {preview && <p>{t("买家获得 {refund} ETH 剩余退款和 {compensation} ETH 固定补偿；你获得 {seller} ETH。", { refund: formatEth(preview[0] - offer.compensation, locale), compensation: formatEth(offer.compensation, locale), seller: formatEth(preview[1], locale) })}</p>}
                <p className="text-muted">{t("金额会记入双方可领取余额，不会直接转入钱包。")}</p>
                <Notice>{transaction.message}</Notice>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" isDisabled={transaction.busy} onPress={() => setConfirming(false)}>{t("返回")}</Button>
                <Button variant="outline" className="border-danger text-danger" isDisabled={transaction.busy || !preview} onPress={() => void revoke()}>{transaction.busy ? t("处理中…") : t("确认撤销并结算")}</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
  );
}
