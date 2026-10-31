import { useLanguage } from "../i18n";
import { Accordion, Button, Chip, Modal, useOverlayState } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import type { Hash } from "viem";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import {
  formatDate,
  formatDuration,
  formatEth,
  offerStatusLabel,
  parseEthSafe,
  utf8Bytes,
} from "../domain";
import { abi, useMarket, useTransaction } from "../market";
import type { Offer, Work } from "../market";
import {
  CheckField,
  Facts,
  Field,
  FormInput,
  FormTextArea,
  Notice,
} from "./ui";

export function OfferCard({ offer, work, onClose }: { offer: Offer; work: Work; onClose: () => void }) {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { address: account } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const transaction = useTransaction();
  const [agree, setAgree] = useState(false);
  const { data: status } = useReadContract({
    address,
    abi,
    functionName: "getOfferStatus",
    chainId,
    args: [offer.id],
    query: { enabled: !!address, refetchInterval: 10_000 },
  });
  const available =
    status === 1 && !work.invalidatedAt && account
      && account.toLowerCase() !== offer.seller.toLowerCase();

  return (
    <article className="space-y-5 rounded-2xl border border-border/60 bg-background/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-2xl font-semibold tracking-tight">
          {formatEth(offer.price, locale)}{" "}
          <span className="text-sm font-normal text-muted">
            ETH · {formatDuration(offer.duration, locale)}
          </span>
        </h3>
        <Chip
          size="sm"
          color={status === 1 ? "accent" : "default"}
          variant="soft"
        >
          {status === undefined ? t("读取中") : t(offerStatusLabel(status))}
        </Chip>
      </div>
      <Facts
        items={[
          [t("使用范围"), offer.scope],
          [t("补偿押金"), `${formatEth(offer.compensation, locale)} ETH`],
          [t("接受截止时间"), formatDate(offer.acceptUntil, locale)],
        ]}
      />
      <Accordion className="rounded-xl border border-border px-4">
        <Accordion.Item id="terms">
          <Accordion.Heading>
            <Accordion.Trigger>{t("许可条款摘要")}</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <ul className="list-disc space-y-2 pl-5 text-muted">
                <li>{t("有期限、非独占、不可转让、不可转授权。")}</li>
                <li>{t("许可区间为 [开始时间, 结束时间)，到期自动失效。")}</li>
                <li>{t("作者提前撤销时，买家获得剩余退款和固定补偿。")}</li>
                <li>{t("登记是权利声明，不代表平台证明真实权属。")}</li>
                <li>
                  {t("平台不保存或交付原始文件，双方各自承担网络手续费。")}
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      <CheckField isSelected={agree} onChange={setAgree}>
        {t("我已阅读并接受上述条款及使用范围")}
      </CheckField>
      <p className="text-xs leading-relaxed text-muted">{t("每笔挂单仅限一人接受。若已被他人先行接受，本次交易将失败；已上链的失败交易仍可能消耗 Gas。")}</p>
      <Notice>{transaction.message}</Notice>
      <div className="flex items-center gap-2">
      <Button variant="outline" isDisabled={transaction.busy} onPress={onClose}>{t("关闭")}</Button>
      <Button
        className="flex-1"
        isDisabled={!available || !agree || transaction.busy}
        onPress={() =>
          address &&
          transaction.run(() =>
            writeContractAsync({
              address,
              abi,
              functionName: "acceptOffer",
              chainId,
              args: [offer.id, offer.termsHash],
              value: offer.price,
            }),
          )
        }
      >
        {transaction.busy ? t("确认中…") : t("接受授权")}
      </Button>
      </div>
    </article>
  );
}

export function OfferModal({
  work,
  onClose,
}: {
  work: Work;
  onClose: () => void;
}) {
  const { t, locale } = useLanguage();
  const { address, chainId } = useMarket();
  const { address: account } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const transaction = useTransaction();
  const client = usePublicClient({ chainId });
  const [publishing, setPublishing] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [completed, setCompleted] = useState(0);
  const pendingHash = useRef<Hash | undefined>(undefined);
  const deadline = useRef<bigint | undefined>(undefined);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const busy = publishing || transaction.busy;
  const modal = useOverlayState({
    isOpen: true,
    onOpenChange: (open) => {
      if (!open && !busy) onClose();
    },
  });
  const [price, setPrice] = useState("0.001");
  const [compensation, setCompensation] = useState("0.0002");
  const [days, setDays] = useState("7");
  const [scope, setScope] = useState(t("仅限课堂展示和非商业研究"));
  const deposit = parseEthSafe(price) + parseEthSafe(compensation);
  const count = Number(quantity);
  const validCount = /^\d+$/.test(quantity) && count >= 1 && count <= 20;
  const isRegistrant = account?.toLowerCase() === work.registrant.toLowerCase();
  const valid =
    isRegistrant &&
    parseEthSafe(price) > 0n &&
    parseEthSafe(price) <= 1000000000000000000n &&
    /^\d+(\.\d{1,18})?$/.test(compensation) &&
    parseEthSafe(compensation) > 0n &&
    parseEthSafe(compensation) <= 1000000000000000000n &&
    validCount &&
    Number.isInteger(Number(days)) &&
    Number(days) >= 1 &&
    Number(days) <= 365 &&
    scope.trim() &&
    utf8Bytes(scope.trim()) <= 512;

  async function submit() {
    if (!valid || !address || !client || busy) return;
    setPublishing(true);
    try {
      for (let index = completed; index < count; index++) {
        if (!active.current) return;
        const success = await transaction.run(async () => {
          // 回执超时后继续等待同一交易，避免重复发布；钱包拒绝后只重试剩余份数。
          if (pendingHash.current) return pendingHash.current;
          deadline.current ??= (await client.getBlock()).timestamp + 86400n;
          if (!active.current) throw new Error("批量发布已停止，请重新打开挂单表单。");
          pendingHash.current = await writeContractAsync({
            address, abi, functionName: "createOffer", chainId, account,
            value: deposit,
            args: [work.id, parseEthSafe(price), BigInt(Number(days) * 86400), parseEthSafe(compensation), deadline.current, scope.trim()],
          });
          return pendingHash.current;
        });
        if (!success) {
          if (pendingHash.current) {
            const receipt = await client.getTransactionReceipt({ hash: pendingHash.current }).catch(() => undefined);
            if (receipt?.status === "reverted") pendingHash.current = undefined;
          }
          return;
        }
        pendingHash.current = undefined;
        setCompleted(index + 1);
      }
      if (active.current) onClose();
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Modal isOpen={modal.isOpen} onOpenChange={modal.setOpen}>
      <Modal.Backdrop isDismissable={!busy}>
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog className="border border-border bg-surface">
            <Modal.Header>
              <div className="flex w-full items-center justify-between gap-3">
                <Modal.Heading className="text-lg font-semibold">
                  {t("创建授权挂单")}
                </Modal.Heading>
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={busy}
                  onPress={modal.close}
                >
                  {t("关闭")}
                </Button>
              </div>
            </Modal.Header>
            <Modal.Body className="space-y-5">
              <p className="text-sm text-muted">{t("可批量发布相同配置的挂单，每份均为独立的非独占授权。每份需要一次钱包确认并支付押金及 Gas；中途取消后可继续剩余份数。")}</p>
              {!isRegistrant && (
                <Notice>
                  {t("只有作品登记人可以创建挂单，请切换钱包账户。")}
                </Notice>
              )}
              <fieldset disabled={busy || completed > 0 || !!pendingHash.current} className="space-y-5 disabled:opacity-70">
                <Field label={t("批量份数")} hint={t("每次 1–20 份，默认为 1 份。价格和补偿均为每份金额。")}>
                  <FormInput type="number" min={1} max={20} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("许可价格（ETH）")}>
                    <FormInput
                      className="w-full"
                      inputMode="decimal"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                    />
                  </Field>
                  <Field label={t("固定补偿（ETH）")}>
                    <FormInput
                      className="w-full"
                      inputMode="decimal"
                      value={compensation}
                      onChange={(event) => setCompensation(event.target.value)}
                    />
                  </Field>
                </div>
                <Field
                  label={t("许可期限（天）")}
                  hint={t("挂单在发布 24 小时后截止接受。")}
                >
                  <FormInput
                    className="w-full"
                    type="number"
                    min={1}
                    max={365}
                    value={days}
                    onChange={(event) => setDays(event.target.value)}
                  />
                </Field>
                <Field
                  label={t("使用范围")}
                  hint={t("{count} / {limit} 字节", {
                    count: utf8Bytes(scope.trim()),
                    limit: 512,
                  })}
                >
                  <FormTextArea
                    className="w-full"
                    rows={3}
                    value={scope}
                    onChange={(event) => setScope(event.target.value)}
                  />
                </Field>
              </fieldset>
              <p className="text-sm">{t("每份押金：{amount} ETH（价格 + 补偿）", { amount: formatEth(deposit, locale) })}</p>
              <p className="text-sm font-semibold">{t("剩余需锁定押金：{amount} ETH，另计 Gas。", { amount: formatEth(validCount ? deposit * BigInt(count - completed) : 0n, locale) })}</p>
              <p role="status" className="text-sm">{t("已发布 {done} / {total} 份", { done: completed, total: validCount ? count : 0 })}</p>
              <Notice>{transaction.message}</Notice>
            </Modal.Body>
            <Modal.Footer className="pt-0">
              <Button
                fullWidth
                isDisabled={!valid || busy}
                onPress={submit}
              >
                {busy ? t("发布中…") : completed > 0 || pendingHash.current ? t("继续剩余挂单") : t("锁定押金并发布")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
