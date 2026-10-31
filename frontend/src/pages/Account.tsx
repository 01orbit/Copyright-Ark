import { useLanguage } from "../i18n";
import { Button } from "@heroui/react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatEth } from "../domain";
import { abi, useMarket, useTransaction } from "../market";
import { WalletButton } from "../components/Layout";
import { Facts, Notice, PageHeading, Panel } from "../components/ui";

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
  const { data: accounting } = useReadContract({
    address,
    abi,
    functionName: "getAccounting",
    chainId,
    query: { enabled: !!address },
  });

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
                  "退款、许可收入和案件报酬先记入余额，领取后转入当前钱包。锁定押金不计入可领取余额。",
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
            <Panel title={t("平台资金概况")}>
              <p className="text-sm text-muted">{t("以下为全平台合计。")}</p>
              <Facts
                items={[
                  [
                    t("锁定中的押金"),
                    `${formatEth(accounting?.[1], locale)} ETH`,
                  ],
                  [
                    t("案件费用池"),
                    `${formatEth(accounting?.[3], locale)} ETH`,
                  ],
                  [
                    t("待拨付案件报酬"),
                    `${formatEth(accounting?.[4], locale)} ETH`,
                  ],
                ]}
              />
            </Panel>
          </>
        )}
      </div>
    </>
  );
}
