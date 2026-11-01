import { useLanguage } from "../i18n";
import { Button } from "@heroui/react";
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import type { Hash } from "viem";
import { formatEth, parseEthSafe, shorten, utf8Bytes } from "../domain";
import { abi, useMarket, useTransaction } from "../market";
import {
  Facts,
  Field,
  FormInput,
  FormSelect,
  FormTextArea,
  Notice,
  PageHeading,
  Panel,
} from "../components/ui";

const isHash = (value: string) =>
  /^0x[\da-fA-F]{64}$/.test(value) && BigInt(value) !== 0n;
const isId = (value: string) => /^\d+$/.test(value) && BigInt(value) > 0n;

export default function Admin() {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { address: account } = useAccount();
  const { data: owner } = useReadContract({
    address,
    abi,
    functionName: "owner",
    chainId,
    query: { enabled: !!address },
  });
  const { data: accountIsAdmin } = useReadContract({
    address,
    abi,
    functionName: "isAdmin",
    chainId,
    args: [account!],
    query: { enabled: !!address && !!account },
  });
  const { data: subsidy } = useReadContract({
    address,
    abi,
    functionName: "gasSubsidy",
    chainId,
    query: { enabled: !!address },
  });
  const { data: reward } = useReadContract({
    address,
    abi,
    functionName: "reviewReward",
    chainId,
    query: { enabled: !!address },
  });
  const { data: accounting } = useReadContract({
    address,
    abi,
    functionName: "getAccounting",
    chainId,
    query: { enabled: !!address },
  });
  const { writeContractAsync } = useWriteContract();
  const transaction = useTransaction();
  const [workId, setWorkId] = useState("");
  const [reference, setReference] = useState("CASE-2026-0001");
  const [evidence, setEvidence] = useState("");
  const [caseId, setCaseId] = useState("");
  const [decisionHash, setDecisionHash] = useState("");
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState(2);
  const isAdmin = accountIsAdmin === true;
  const canOpen =
    isId(workId) && /^[A-Z0-9-]{1,64}$/.test(reference) && isHash(evidence);
  const canResolve =
    isId(caseId) &&
    isHash(decisionHash) &&
    summary.trim() &&
    utf8Bytes(summary.trim()) <= 512;

  return (
    <>
      <PageHeading title={t("管理台")}>
        {t("录入线下案件并提交处理结果，案件报酬来自独立费用池。")}
      </PageHeading>
      {!isAdmin ? (
        <Notice>
          {t("请使用已授权的管理员钱包连接。链上 owner：")}
          {shorten(owner)}
        </Notice>
      ) : (
        <>
          <Notice>{transaction.message}</Notice>
          <div className="grid items-start gap-6 md:grid-cols-2">
            <Panel title={t("录入案件")}>
              <Field label={t("作品编号")}>
                <FormInput
                  className="w-full"
                  inputMode="numeric"
                  value={workId}
                  onChange={(event) => setWorkId(event.target.value)}
                />
              </Field>
              <Field
                label={t("线下案件编号")}
                hint={t("1–64 位大写字母、数字或连字符。")}
              >
                <FormInput
                  className="w-full"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </Field>
              <Field
                label={t("证据文件 SHA-256")}
                hint={t("仅记录指纹，原始材料不上传链上。")}
              >
                <FormInput
                  className="w-full"
                  value={evidence}
                  placeholder={t("0x + 64 位十六进制")}
                  onChange={(event) => setEvidence(event.target.value)}
                />
              </Field>
              <Button
                isDisabled={!canOpen || transaction.busy}
                onPress={() =>
                  address &&
                  transaction.run(() =>
                    writeContractAsync({
                      address,
                      abi,
                      functionName: "openCase",
                      chainId,
                      args: [BigInt(workId), reference, evidence as Hash],
                    }),
                  )
                }
              >
                {t("录入待处理案件")}
              </Button>
            </Panel>
            <Panel title={t("提交案件结果")}>
              <Field label={t("案件编号")}>
                <FormInput
                  className="w-full"
                  inputMode="numeric"
                  value={caseId}
                  onChange={(event) => setCaseId(event.target.value)}
                />
              </Field>
              <Field label={t("裁决结果")}>
                <FormSelect
                  label={t("裁决结果")}
                  value={String(outcome)}
                  onChange={(value) => setOutcome(Number(value))}
                  options={[
                    { value: "1", label: t("维持登记") },
                    { value: "2", label: t("撤销登记") },
                  ]}
                />
              </Field>
              <Field label={t("裁决文件 SHA-256")}>
                <FormInput
                  className="w-full"
                  value={decisionHash}
                  placeholder={t("0x + 64 位十六进制")}
                  onChange={(event) => setDecisionHash(event.target.value)}
                />
              </Field>
              <Field
                label={t("处理摘要")}
                hint={t("{count} / {limit} 字节", {
                  count: utf8Bytes(summary.trim()),
                  limit: 512,
                })}
              >
                <FormTextArea
                  className="w-full"
                  rows={3}
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                />
              </Field>
              <Button
                isDisabled={!canResolve || transaction.busy}
                onPress={() =>
                  address &&
                  transaction.run(() =>
                    writeContractAsync({
                      address,
                      abi,
                      functionName: "resolveCase",
                      chainId,
                      args: [
                        BigInt(caseId),
                        outcome,
                        decisionHash as Hash,
                        summary.trim(),
                      ],
                    }),
                  )
                }
              >
                {t("提交处理结果")}
              </Button>
            </Panel>
          </div>
          <Panel title={t("平台资金概况")}>
            <p className="text-sm text-muted">{t("以下为全平台合计。")}</p>
            <Facts
              items={[
                [t("合约 ETH 余额"), `${formatEth(accounting?.[0], locale)} ETH`],
                [t("全平台锁定押金"), `${formatEth(accounting?.[1], locale)} ETH`],
                [t("用户待领取余额"), `${formatEth(accounting?.[2], locale)} ETH`],
                [t("案件费用池余额"), `${formatEth(accounting?.[3], locale)} ETH`],
                [t("待拨付案件报酬"), `${formatEth(accounting?.[4], locale)} ETH`],
                [t("合约可用盈余"), `${formatEth(accounting?.[5], locale)} ETH`],
              ]}
            />
          </Panel>
          <Panel title={t("案件费用池")}>
            <Facts
              items={[
                [t("每案 Gas 补贴"), `${formatEth(subsidy, locale)} ETH`],
                [t("每案处理报酬"), `${formatEth(reward, locale)} ETH`],
              ]}
            />
            <p className="text-sm text-muted">
              {t(
                "费用池与许可押金独立。费用池不足不影响结案，注资后可另行拨付报酬。",
              )}
            </p>
            <Button
              variant="outline"
              className="self-start"
              isDisabled={transaction.busy}
              onPress={() =>
                address &&
                transaction.run(() =>
                  writeContractAsync({
                    address,
                    abi,
                    functionName: "fundRewardPool",
                    chainId,
                    value: parseEthSafe("0.01"),
                  }),
                )
              }
            >
              {t("注资 0.01 ETH")}
            </Button>
          </Panel>
        </>
      )}
    </>
  );
}
