import { useLanguage } from "../i18n";
import { Button, Chip } from "@heroui/react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useReadContract, useReadContracts } from "wagmi";
import { isAddress } from "viem";
import type { Address } from "viem";
import { formatDate, licenseStatusLabel } from "../domain";
import { abi, useMarket } from "../market";
import {
  EmptyState,
  Field,
  FormInput,
  Notice,
  PageHeading,
  Panel,
} from "../components/ui";

type Search = { wallet: Address; workId: string; at?: number };

export default function Verify() {
  const { t, locale } = useLanguage();
  const { address } = useMarket();
  const [params] = useSearchParams();
  const [wallet, setWallet] = useState(() => params.get("wallet") || "");
  const [workId, setWorkId] = useState("");
  const [at, setAt] = useState("");
  const [search, setSearch] = useState<Search>();
  const timestamp = at ? Math.floor(new Date(at).getTime() / 1000) : undefined;
  const valid =
    isAddress(wallet) &&
    (!workId || /^\d+$/.test(workId)) &&
    (timestamp === undefined ||
      (timestamp > 0 && timestamp <= Date.now() / 1000));

  return (
    <>
      <PageHeading title={t("使用权查询")}>
        {t("按钱包地址查询平台许可，可指定作品和历史时间。无需连接钱包。")}
      </PageHeading>
      <div className="max-w-2xl space-y-6">
        <Panel title={t("查询条件")}>
          <Field label={t("钱包地址")}>
            <FormInput
              className="w-full"
              value={wallet}
              placeholder="0x…"
              onChange={(event) => setWallet(event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("作品编号（可选）")}>
              <FormInput
                className="w-full"
                inputMode="numeric"
                value={workId}
                onChange={(event) => setWorkId(event.target.value)}
              />
            </Field>
            <Field
              label={t("历史时间（可选）")}
              hint={t("留空查询当前状态，不支持未来时间。")}
            >
              <FormInput
                className="w-full"
                type="datetime-local"
                value={at}
                onChange={(event) => setAt(event.target.value)}
              />
            </Field>
          </div>
          <Button
            isDisabled={!valid || !address}
            onPress={() =>
              setSearch({ wallet: wallet as Address, workId, at: timestamp })
            }
          >
            {t("查询链上记录")}
          </Button>
        </Panel>
        {search && <Results key={JSON.stringify(search)} search={search} />}
      </div>
    </>
  );
}

function Results({ search }: { search: Search }) {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { data, isLoading, error } = useReadContract({
    address,
    abi,
    functionName: "getLicenseIdsByLicensee",
    chainId,
    args: [search.wallet, 0n, 50n],
    query: { enabled: !!address },
  });
  const ids = data?.[0] ?? [];
  const {
    data: records,
    isLoading: loadingRecords,
    error: recordsError,
  } = useReadContracts({
    contracts: ids.map(
      (id) =>
        ({
          address: address!,
          abi,
          functionName: "getLicense",
          chainId,
          args: [id],
        }) as const,
    ),
    query: { enabled: !!address && ids.length > 0 },
  });
  const licenses = (records ?? [])
    .flatMap((result) => (result.result ? [result.result] : []))
    .filter(
      (license) => !search.workId || license.workId === BigInt(search.workId),
    );
  const {
    data: statuses,
    isLoading: loadingStatuses,
    error: statusesError,
  } = useReadContracts({
    contracts: licenses.map((license) =>
      search.at === undefined
        ? ({
            address: address!,
            abi,
            functionName: "getLicenseStatus",
            chainId,
            args: [license.id],
          } as const)
        : ({
            address: address!,
            abi,
            functionName: "isLicenseValidAt",
            chainId,
            args: [license.id, BigInt(search.at)],
          } as const),
    ),
    query: { enabled: !!address && licenses.length > 0 },
  });

  if (error || recordsError || statusesError)
    return <Notice>{t("查询失败，请检查网络和查询条件。")}</Notice>;
  if (isLoading || loadingRecords || loadingStatuses)
    return <EmptyState>{t("正在查询链上记录…")}</EmptyState>;
  return (
    <Panel title={t("查询结果")}>
      {!licenses.length ? (
        <EmptyState>{t("没有匹配的平台许可记录。")}</EmptyState>
      ) : (
        licenses.map((license, index) => {
          const status = statuses?.[index]?.result;
          return (
            <div
              key={String(license.id)}
              className="space-y-2 border-b border-border/60 pb-4 text-sm last:border-0"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <strong>
                  {t("许可 #")}
                  {String(license.id)} {t("· 作品 #")}
                  {String(license.workId)}
                </strong>
                <Chip size="sm" variant="soft">
                  {typeof status === "boolean"
                    ? status
                      ? t("指定时间有效")
                      : t("指定时间无效")
                    : typeof status === "number"
                      ? t(licenseStatusLabel(status))
                      : t("状态读取失败")}
                </Chip>
              </div>
              <p className="text-muted">
                {formatDate(license.startsAt, locale)} —{" "}
                {formatDate(license.endsAt, locale)}
              </p>
            </div>
          );
        })
      )}
      <p className="text-xs text-muted">
        {t("结果仅说明平台链上记录，每次最多读取 50 条许可。")}
      </p>
    </Panel>
  );
}
