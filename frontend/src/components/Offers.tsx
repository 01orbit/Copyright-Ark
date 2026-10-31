import { useLanguage } from "../i18n";
import { Accordion, Button, Chip, Modal, useOverlayState } from "@heroui/react";
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import {
  formatDate,
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

export function OfferCard({ offer, work }: { offer: Offer; work: Work }) {
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
    query: { enabled: !!address },
  });
  const available =
    status === 1 && !work.invalidatedAt && account && account !== offer.seller;

  return (
    <article className="space-y-5 rounded-2xl border border-border/60 bg-background/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-2xl font-semibold tracking-tight">
          {formatEth(offer.price, locale)}{" "}
          <span className="text-sm font-normal text-muted">
            ETH · {Number(offer.duration) / 86400} {t("天")}
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
      <Notice>{transaction.message}</Notice>
      <Button
        fullWidth
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
  const modal = useOverlayState({
    isOpen: true,
    onOpenChange: (open) => {
      if (!open && !transaction.busy) onClose();
    },
  });
  const [price, setPrice] = useState("0.001");
  const [compensation, setCompensation] = useState("0.0002");
  const [days, setDays] = useState("7");
  const [scope, setScope] = useState(t("仅限课堂展示和非商业研究"));
  const deposit = parseEthSafe(price) + parseEthSafe(compensation);
  const isRegistrant = account?.toLowerCase() === work.registrant.toLowerCase();
  const valid =
    isRegistrant &&
    parseEthSafe(price) > 0n &&
    /^\d+(\.\d{1,18})?$/.test(compensation) &&
    Number.isInteger(Number(days)) &&
    Number(days) >= 1 &&
    Number(days) <= 365 &&
    scope.trim() &&
    utf8Bytes(scope.trim()) <= 512;

  async function submit() {
    if (!valid || !address) return;
    const success = await transaction.run(() =>
      writeContractAsync({
        address,
        abi,
        functionName: "createOffer",
        chainId,
        value: deposit,
        args: [
          work.id,
          parseEthSafe(price),
          BigInt(Number(days) * 86400),
          parseEthSafe(compensation),
          BigInt(Math.floor(Date.now() / 1000) + 86400),
          scope.trim(),
        ],
      }),
    );
    if (success) onClose();
  }

  return (
    <Modal isOpen={modal.isOpen} onOpenChange={modal.setOpen}>
      <Modal.Backdrop isDismissable={!transaction.busy}>
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
                  isDisabled={transaction.busy}
                  onPress={modal.close}
                >
                  {t("关闭")}
                </Button>
              </div>
            </Modal.Header>
            <Modal.Body className="space-y-5">
              {!isRegistrant && (
                <Notice>
                  {t("只有作品登记人可以创建挂单，请切换钱包账户。")}
                </Notice>
              )}
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
              <p className="text-sm">
                {t("需要锁定押金：")}
                <strong>{formatEth(deposit, locale)} ETH</strong>
                {t("（价格 + 补偿）")}
              </p>
              <Notice>{transaction.message}</Notice>
            </Modal.Body>
            <Modal.Footer className="pt-0">
              <Button
                fullWidth
                isDisabled={!valid || transaction.busy}
                onPress={submit}
              >
                {transaction.busy ? t("发布中…") : t("锁定押金并发布")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
