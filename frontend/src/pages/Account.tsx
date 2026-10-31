import { useLanguage } from "../i18n";
import { Button } from "@heroui/react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { formatEth } from "../domain";
import { abi, useMarket, useTransaction } from "../market";
import { WalletButton } from "../components/Layout";
import { Notice, PageHeading, Panel } from "../components/ui";

export default function Account() {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { address: account, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const transaction = useTransaction();
  const { data: balance, error } = useReadContract({
    address,
    abi,
    functionName: "claimable",
    chainId,
    args: [account!],
    query: { enabled: !!address && !!account },
  });
  const {
    data: firstOfferPage,
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
  const totalOffers = Number(firstOfferPage?.[1] ?? 0n);
  const extraPageOffsets = Array.from(
    { length: Math.max(0, Math.ceil(totalOffers / 50) - 1) },
    (_, index) => BigInt((index + 1) * 50),
  );
  const {
    data: extraOfferPages,
    isLoading: loadingExtraOfferIds,
    error: extraOfferIdsError,
  } = useReadContracts({
    contracts: extraPageOffsets.map(
      (offset) =>
        ({
          address: address!,
          abi,
          functionName: "getOfferIdsBySeller",
          chainId,
          args: [account!, offset, 50n],
        }) as const,
    ),
    query: { enabled: !!address && !!account && extraPageOffsets.length > 0 },
  });
  const offerIds = [
    ...(firstOfferPage?.[0] ?? []),
    ...(extraOfferPages ?? []).flatMap((page) => page.result?.[0] ?? []),
  ];
  const {
    data: offerResults,
    isLoading: loadingOffers,
    error: offersError,
  } = useReadContracts({
    contracts: offerIds.map(
      (id) =>
        ({
          address: address!,
          abi,
          functionName: "getOffer",
          chainId,
          args: [id],
        }) as const,
    ),
    query: { enabled: !!address && offerIds.length > 0 },
  });
  const offers = (offerResults ?? []).flatMap((result) =>
    result.result ? [result.result] : [],
  );
  const acceptedOffers = offers.filter((offer) => Number(offer.state) === 2);
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
  const lockedDeposit = offers.reduce((total, offer) => {
    const state = Number(offer.state);
    if (state === 1) return total + offer.price + offer.compensation;
    if (state !== 2) return total;
    const licenseIndex = acceptedOffers.findIndex((item) => item.id === offer.id);
    const license = licenseResults?.[licenseIndex]?.result;
    return license && !license.settled
      ? total + offer.price + offer.compensation
      : total;
  }, 0n);
  const loadingLockedDeposit =
    loadingOfferIds ||
    loadingExtraOfferIds ||
    loadingOffers ||
    loadingLicenses;
  const lockedDepositError =
    offerIdsError || extraOfferIdsError || offersError || licensesError;

  return (
    <>
      <PageHeading title={t("我的账户")}>
        {isConnected ? (
          <span className="break-all">
            {t("当前钱包：")}
            {account}
          </span>
        ) : (
          t("连接钱包后查看可领取资金。")
        )}
      </PageHeading>
      <div className="max-w-2xl space-y-6">
        {!isConnected ? (
          <Panel title={t("连接钱包")}>
            <WalletButton />
          </Panel>
        ) : (
          <>
            <Panel title={t("可领取余额")}>
              {error ? (
                <Notice>{t("余额读取失败，请检查网络。")}</Notice>
              ) : (
                <p className="text-3xl font-semibold">
                  {formatEth(balance, locale)}{" "}
                  <span className="text-base font-normal">ETH</span>
                </p>
              )}
              <p className="text-sm leading-relaxed text-muted">
                {t(
                  "可领取余额包括已成交许可收入、退款和案件报酬；挂单中的价格与补偿押金仍被锁定，不能在此领取。撤销未成交挂单后，押金才会转为可领取余额。",
                )}
              </p>
              <Notice>{transaction.message}</Notice>
              <Button
                className="self-start"
                isDisabled={!balance || transaction.busy}
                onPress={() =>
                  address &&
                  account &&
                  transaction.run(() =>
                    writeContractAsync({
                      address,
                      abi,
                      functionName: "withdraw",
                      chainId,
                      args: [account],
                    }),
                  )
                }
              >
                {transaction.busy ? t("领取中…") : t("领取全部余额")}
              </Button>
            </Panel>
            <Panel title={t("本人锁定押金")}>
              <p className="text-3xl font-semibold">
                {loadingLockedDeposit
                  ? "—"
                  : lockedDepositError
                    ? t("读取失败")
                    : formatEth(lockedDeposit, locale)}{" "}
                <span className="text-base font-normal">ETH</span>
              </p>
              <p className="text-sm leading-relaxed text-muted">
                {t(
                  "这是当前钱包作为作者存入、仍被未退还挂单或未结算许可锁定的押金。退还或结算后会转为可领取余额。",
                )}
              </p>
              {lockedDepositError && (
                <Notice>{t("押金读取失败，请检查网络。")}</Notice>
              )}
            </Panel>
          </>
        )}
      </div>
    </>
  );
}
