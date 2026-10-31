import { useState } from "react";
import { Button } from "@heroui/react";
import { useAccount, useSignMessage } from "wagmi";
import { hashFile, validateFile } from "../domain";
import { useMarket, type Work } from "../market";
import { useLanguage } from "../i18n";
import { coverApi, getCoverDraft, setCoverDraft, uploadCover } from "../covers/client";
import { generateCover } from "../covers/generate";
import { useBlobUrl } from "../covers/useBlobUrl";
import { useCoverTarget } from "../covers/useCoverTarget";
import { Notice } from "./ui";

export default function CoverUpload({ work, onUploaded }: { work: Work; onUploaded: () => void }) {
  const { t } = useLanguage();
  const { address: wallet } = useAccount();
  const { walletReady } = useMarket();
  const { signMessageAsync } = useSignMessage();
  const target = useCoverTarget(work);
  const [blob, setBlob] = useState(() => getCoverDraft(work.fileHash));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const preview = useBlobUrl(blob);
  if (!coverApi || wallet?.toLowerCase() !== work.registrant.toLowerCase()) return null;

  async function select(file?: File) {
    const error = validateFile(file);
    if (error || !file) { setMessage(error); return; }
    setBusy(true);
    setBlob(undefined);
    setMessage("正在生成封面…");
    try {
      if (await hashFile(file) !== work.fileHash) throw new Error("文件与链上指纹不一致，请选择登记时的原文件。");
      const cover = await generateCover(file);
      setBlob(cover);
      setCoverDraft(work.fileHash, cover);
      setMessage("");
    } catch (error) { setMessage(error instanceof Error && error.message.includes("链上指纹") ? error.message : "无法生成封面，请检查文件格式、损坏或加密情况。"); }
    finally { setBusy(false); }
  }

  async function publish() {
    if (!target || !blob || !wallet || !walletReady) return;
    setBusy(true);
    setMessage("请在钱包中签署封面发布消息，无需 Gas。");
    try {
      await uploadCover(target, blob, wallet, (message) => signMessageAsync({ message, account: wallet }));
      setMessage("封面已公开发布；若已存在封面，则保留首次发布的版本。");
      onUploaded();
    } catch (error) { setMessage(error instanceof Error && /[\u4e00-\u9fff]/.test(error.message) ? error.message : "封面上传失败，请检查服务配置、网络和钱包签名后重试。"); }
    finally { setBusy(false); }
  }

  return <div className="space-y-3 rounded-xl border border-border p-4 text-sm">
    <p className="font-medium">{t("作品封面")}</p>
    <p className="text-xs text-muted">{t("只公开生成的封面，不上传原文件。封面不作为链上版权证明，发布后所有访问者可见。")}</p>
    <label className="flex flex-col gap-2">
      <span>{t("选择原文件生成封面")}</span>
      <input type="file" accept=".png,.jpg,.jpeg,.webp,.txt,.pdf,.mp3,.wav,.mp4" disabled={busy}
        onChange={(event) => { void select(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
    </label>
    {preview && <img src={preview} alt={t("待发布封面预览")} className="h-64 w-full rounded-lg border border-border bg-background object-contain" />}
    <Button size="sm" isDisabled={busy || !blob || !target || !walletReady} onPress={publish}>
      {busy ? t("处理中…") : t("发布封面 / 重试")}
    </Button>
    <Notice>{message}</Notice>
  </div>;
}
