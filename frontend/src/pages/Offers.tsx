import { useLanguage } from "../i18n";
import { Button, Chip, Modal, useOverlayState } from "@heroui/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import {
  categories,
  formatDate,
  formatEth,
  licenseStatusLabel,
  offerStatusLabel,
  shorten,
} from "../domain";
import { abi, useMarket, useTransaction } from "../market";
import type { License, Offer, Work } from "../market";
import { CompactList } from "../components/CompactList";
import { EmptyState, Notice, PageHeading } from "../components/ui";
import { WalletButton } from "../components/Layout";
import { OfferModal } from "../components/Offers";
import { useRecordIds } from "../hooks/useRecordIds";

type StatusItem<T> = { item: T; status?: number };
type ManagedLicenseItem = {
  offer: Offer;
  license: License;
  status?: number;
};

export default function Offers() {
  const { t } = useLanguage();
  const { address, chainId } = useMarket();
  const { address: account, isConnected } = useAccount();
  const [selectedWork, setSelectedWork] = useState<Work>();
  const { ids: sellerOfferIds, loading: loadingOfferIds, error: offerIdsError } =
    useRecordIds(account, "getOfferIdsBySeller");
  const {
    data: offerResults,
    isLoading: loadingOffers,
    error: offersError,
  } = useReadContracts({
    contracts: sellerOfferIds.map(
      (id) =>
        ({
          address: address!,
          abi,
          functionName: "getOffer",
          chainId,
          args: [id],
        }) as const,
    ),
    query: { enabled: !!address && sellerOfferIds.length > 0, refetchInterval: 10_000 },
  });
  const offers = (offerResults ?? []).flatMap((result) =>
    result.result ? [result.result] : [],
  );
  const {
    data: offerStatusResults,
    isLoading: loadingOfferStatuses,
    error: offerStatusesError,
  } = useReadContracts({
    contracts: offers.map(
      (offer) =>
        ({
          address: address!,
          abi,
          functionName: "getOfferStatus",
          chainId,
          args: [offer.id],
        }) as const,
    ),
    query: { enabled: !!address && offers.length > 0, refetchInterval: 10_000 },
  });
  const offerItems: StatusItem<Offer>[] = offers.map((offer, index) => ({
    item: offer,
    status:
      offerStatusResults?.[index]?.result === undefined
        ? undefined
        : Number(offerStatusResults[index].result),
  }));

  const { ids: registrantWorkIds, loading: loadingWorkIds, error: workIdsError } =
    useRecordIds(account, "getWorkIdsByRegistrant");
  const {
    data: workResults,
    isLoading: loadingWorks,
    error: worksError,
  } = useReadContracts({
    contracts: registrantWorkIds.map(
      (id) =>
        ({
          address: address!,
          abi,
          functionName: "getWork",
          chainId,
          args: [id],
        }) as const,
    ),
    query: { enabled: !!address && registrantWorkIds.length > 0 },
  });
  const works = (workResults ?? []).flatMap((result) =>
    result.result ? [result.result] : [],
  );

  const acceptedOffers = offers.filter((offer) => offer.licenseId > 0n);
  const {
    data: licenseResults,
    isLoading: loadingLicenses,
    error: licensesError,
  } = useReadContracts({
    contracts: acceptedOffers.map(
      (offer) =>
        ({
          address: address!,
          abi,
          functionName: "getLicense",
          chainId,
          args: [offer.licenseId],
        }) as const,
    ),
    query: { enabled: !!address && acceptedOffers.length > 0 },
  });
  const licenses = (licenseResults ?? []).flatMap((result, index) =>
    result.result ? [{ offer: acceptedOffers[index], license: result.result }] : [],
  );
  const {
    data: licenseStatusResults,
    isLoading: loadingLicenseStatuses,
    error: licenseStatusesError,
  } = useReadContracts({
    contracts: licenses.map(
      ({ license }) =>
        ({
          address: address!,
          abi,
          functionName: "getLicenseStatus",
          chainId,
          args: [license.id],
        }) as const,
    ),
    query: { enabled: !!address && licenses.length > 0 },
  });
  const licenseItems: ManagedLicenseItem[] = licenses.map(
    ({ offer, license }, index) => ({
      offer,
      license,
      status:
        licenseStatusResults?.[index]?.result === undefined
          ? undefined
          : Number(licenseStatusResults[index].result),
    }),
  );

  const readError =
    offerIdsError ||
    offersError ||
    offerStatusesError ||
    workIdsError ||
    worksError ||
    licensesError ||
    licenseStatusesError;
  const loading =
    loadingOfferIds ||
    loadingOffers ||
    loadingOfferStatuses ||
    loadingWorkIds ||
    loadingWorks ||
    loadingLicenses ||
    loadingLicenseStatuses;

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
      ) : loading ? (
        <EmptyState>{t("正在读取作品…")}</EmptyState>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3" aria-label={t("我发布的挂单")}>
            <h2 className="text-xl font-semibold">{t("我发布的挂单")}</h2>
            {offerItems.length ? (
              <CompactList
                items={offerItems}
                getKey={({ item }) => String(item.id)}
                getStatus={({ status }) => String(status ?? "loading")}
                getSearchText={({ item }) => `${item.id} ${item.workId}`}
                statusOptions={[
                  { value: "1", label: t(offerStatusLabel(1)) },
                  { value: "2", label: t(offerStatusLabel(2)) },
                  { value: "3", label: t(offerStatusLabel(3)) },
                  { value: "4", label: t(offerStatusLabel(4)) },
                  { value: "5", label: t(offerStatusLabel(5)) },
                ]}
                searchLabel="搜索作品或挂单编号"
                emptyMessage="没有符合条件的挂单。"
                filtersReady={!loadingOfferStatuses}
                renderItem={({ item, status }) => (
                  <ManagedOffer offer={item} status={status} />
                )}
              />
            ) : (
              <EmptyState>{t("你还没有发布挂单。")}</EmptyState>
            )}
          </section>

          <section className="space-y-3" aria-label={t("我签发的许可")}>
            <h2 className="text-xl font-semibold">{t("我签发的许可")}</h2>
            {licenseItems.length ? (
              <CompactList
                items={licenseItems}
                getKey={({ license }) => String(license.id)}
                getStatus={({ status }) => String(status ?? "loading")}
                getSearchText={({ license }) =>
                  `${license.id} ${license.workId} ${license.licensee}`
                }
                statusOptions={[1, 2, 3, 4].map((status) => ({
                  value: String(status),
                  label: t(licenseStatusLabel(status)),
                }))}
                searchLabel="搜索作品、许可编号或钱包"
                emptyMessage="没有符合条件的许可。"
                filtersReady={!loadingLicenseStatuses}
                renderItem={(item) => <ManagedLicense item={item} />}
              />
            ) : (
              <EmptyState>{t("尚无通过挂单签发的许可。")}</EmptyState>
            )}
          </section>

          <section className="space-y-3" aria-label={t("我的登记作品")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{t("我的登记作品")}</h2>
              <Link
                to="/register"
                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted/20"
              >
                {t("登记作品")}
              </Link>
            </div>
            {works.length ? (
              <CompactList
                items={works}
                getKey={(work) => String(work.id)}
                getStatus={(work) => (work.invalidatedAt ? "revoked" : "active")}
                getSearchText={(work) => `${work.id} ${work.title} ${work.description}`}
                statusOptions={[
                  { value: "active", label: t("有效登记") },
                  { value: "revoked", label: t("已撤销") },
                ]}
                searchLabel="搜索作品标题或编号"
                emptyMessage="没有符合条件的作品。"
                renderItem={(work) => (
                  <ManagedWork
                    work={work}
                    onCreateOffer={() => setSelectedWork(work)}
                  />
                )}
              />
            ) : (
              <EmptyState>
                <div className="space-y-3">
                  <p>{t("当前钱包还没有登记作品。")}</p>
                  <Link
                    to="/register"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-accent bg-accent px-4 text-sm font-medium text-white hover:bg-accent/90"
                  >
                    {t("登记作品")}
                  </Link>
                </div>
              </EmptyState>
            )}
          </section>
        </div>
      )}
      {selectedWork && (
        <OfferModal key={`${chainId}:${address}:${account}:${selectedWork.id}`} work={selectedWork} onClose={() => setSelectedWork(undefined)} />
      )}
    </>
  );
}

function ManagedOffer({
  offer,
  status,
}: {
  offer: Offer;
  status?: number;
}) {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { writeContractAsync } = useWriteContract();
  const transaction = useTransaction();
  return (
    <article className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold">{t("挂单 #{id}", { id: String(offer.id) })}</span>
          <span>{t("作品 #{id}", { id: String(offer.workId) })}</span>
          <span className="font-medium">{formatEth(offer.price, locale)} ETH</span>
          <Chip size="sm" variant="soft">
            {status === undefined ? t("读取中") : t(offerStatusLabel(status))}
          </Chip>
        </div>
        {status === 1 && (
          <Button
            size="sm"
            variant="outline"
            className="border-danger text-danger"
            isDisabled={transaction.busy}
            onPress={() =>
              address &&
              transaction.run(() =>
                writeContractAsync({
                  address,
                  abi,
                  functionName: "cancelOffer",
                  chainId,
                  args: [offer.id],
                }),
              )
            }
          >
            {transaction.busy ? t("处理中…") : t("撤销挂单")}
          </Button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">
        {t("期限 {days} 天 · 锁定押金 {amount} ETH", {
          days: Number(offer.duration) / 86400,
          amount: formatEth(offer.price + offer.compensation, locale),
        })}
        {status === 1 && ` · ${t("撤销后，锁定的价格和补偿将计入可领取余额。")}`}
      </p>
      <Notice>{transaction.message}</Notice>
    </article>
  );
}

function ManagedLicense({ item }: { item: ManagedLicenseItem }) {
  const { offer, license, status } = item;
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { writeContractAsync } = useWriteContract();
  const transaction = useTransaction();
  const [confirming, setConfirming] = useState(false);
  const modal = useOverlayState({ isOpen: confirming, onOpenChange: setConfirming });
  const { data: preview } = useReadContract({
    address,
    abi,
    functionName: "previewAuthorRevoke",
    chainId,
    args: [license.id],
    query: { enabled: !!address && status === 1 },
  });
  const active = status === 1;

  async function revoke() {
    if (!address || !active) return;
    const success = await transaction.run(() =>
      writeContractAsync({
        address,
        abi,
        functionName: "revokeLicense",
        chainId,
        args: [license.id],
      }),
    );
    if (success) setConfirming(false);
  }

  return (
    <article className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold">
            {t("许可 #{id}", { id: String(license.id) })}
          </span>
          <span>{t("作品 #{id}", { id: String(license.workId) })}</span>
          <span className="font-mono text-xs text-muted">{shorten(license.licensee)}</span>
          <Chip size="sm" variant="soft">
            {status === undefined ? t("读取中") : t(licenseStatusLabel(status))}
          </Chip>
        </div>
        {active && (
          <Button
            size="sm"
            variant="outline"
            className="border-danger text-danger"
            onPress={() => setConfirming(true)}
          >
            {t("提前撤销授权")}
          </Button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">
        {t("许可期限：{start} 至 {end}", {
          start: formatDate(license.startsAt, locale),
          end: formatDate(license.endsAt, locale),
        })}
        {active && preview && ` · ${t("提前撤销可得")}: ${formatEth(preview[1], locale)} ETH`}
      </p>
      <Notice>{transaction.message}</Notice>
      <Modal isOpen={modal.isOpen} onOpenChange={modal.setOpen}>
        <Modal.Backdrop isDismissable={!transaction.busy}>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog className="border border-border bg-surface">
              <Modal.Header>
                <Modal.Heading>{t("确认提前撤销授权？")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3 text-sm">
                <p>{t("此操作会立即终止许可且不可恢复。")}</p>
                {preview && (
                  <p>
                    {t(
                      "买家获得 {refund} ETH 剩余退款和 {compensation} ETH 固定补偿；你获得 {seller} ETH。",
                      {
                        refund: formatEth(preview[0] - offer.compensation, locale),
                        compensation: formatEth(offer.compensation, locale),
                        seller: formatEth(preview[1], locale),
                      },
                    )}
                  </p>
                )}
                <p className="text-muted">
                  {t("金额会记入双方可领取余额，不会直接转入钱包。")}
                </p>
                <Notice>{transaction.message}</Notice>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="outline"
                  isDisabled={transaction.busy}
                  onPress={() => setConfirming(false)}
                >
                  {t("返回")}
                </Button>
                <Button
                  variant="outline"
                  className="border-danger text-danger"
                  isDisabled={transaction.busy || !preview}
                  onPress={() => void revoke()}
                >
                  {transaction.busy ? t("处理中…") : t("确认撤销并结算")}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </article>
  );
}

function ManagedWork({
  work,
  onCreateOffer,
}: {
  work: Work;
  onCreateOffer: () => void;
}) {
  const { t, locale } = useLanguage();
  const revoked = Boolean(work.invalidatedAt);
  return (
    <article className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold">{work.title}</span>
          <span>#{String(work.id).padStart(3, "0")}</span>
          <Chip size="sm" variant="soft">{t(categories[work.category])}</Chip>
          {revoked && <Chip size="sm" variant="soft">{t("已撤销")}</Chip>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={`/works/${work.id}`}
            className="inline-flex min-h-8 items-center justify-center rounded-lg border border-border px-2.5 text-xs font-medium transition-colors hover:bg-muted/20"
          >
            {t("查看作品")}
          </Link>
          <Button size="sm" isDisabled={revoked} onPress={onCreateOffer}>
            {t("创建挂单")}
          </Button>
        </div>
      </div>
      <p className="mt-1 truncate text-xs text-muted">
        {t("登记于 {date}", { date: formatDate(work.registeredAt, locale) })}
        {work.description && ` · ${work.description}`}
      </p>
    </article>
  );
}
