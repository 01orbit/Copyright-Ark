import { useLanguage } from "../i18n";
import { Button } from "@heroui/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import type { Hash } from "viem";
import { usePublicClient } from "wagmi";
import { coverApi, setCoverDraft } from "../covers/client";
import { generateCover } from "../covers/generate";
import { useBlobUrl } from "../covers/useBlobUrl";
import { categories, hashFile, utf8Bytes, validateFile } from "../domain";
import { abi, useMarket, useTransaction } from "../market";
import {
  CheckField,
  Field,
  FormInput,
  FormSelect,
  FormTextArea,
  Notice,
  PageHeading,
  Panel,
} from "../components/ui";

export default function Register() {
  const { t } = useLanguage();
  const { address, chainId } = useMarket();
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const transaction = useTransaction();
  const navigate = useNavigate();
  const selection = useRef(0);
  const [file, setFile] = useState<File>();
  const [hash, setHash] = useState<Hash>();
  const [cover, setCover] = useState<Blob>();
  const [generating, setGenerating] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const preview = useBlobUrl(cover);
  const client = usePublicClient({ chainId });
  const [fileMessage, setFileMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(1);
  const [agree, setAgree] = useState(false);
  const {
    data: existingId,
    isFetching,
    error,
  } = useReadContract({
    address,
    abi,
    functionName: "activeWorkByHash",
    chainId,
    args: [hash!],
    query: { enabled: !!address && !!hash },
  });
  const valid =
    address &&
    isConnected &&
    hash &&
    !validateFile(file) &&
    title.trim() &&
    utf8Bytes(title.trim()) <= 96 &&
    utf8Bytes(description.trim()) <= 512 &&
    agree &&
    existingId === 0n &&
    !isFetching && !generating;

  async function choose(nextFile?: File) {
    const current = ++selection.current;
    setFile(nextFile);
    setHash(undefined);
    setCover(undefined);
    setGenerating(false);
    setCoverMessage("");
    const error = validateFile(nextFile);
    setFileMessage(error || "正在计算文件指纹…");
    if (error || !nextFile) return;
    try {
      const result = await hashFile(nextFile);
      if (current !== selection.current) return;
      setHash(result);
      setFileMessage("文件指纹已生成");
      if (coverApi) {
        setGenerating(true);
        setCoverMessage("正在生成封面…");
        try {
          const cover = await generateCover(nextFile);
          if (current !== selection.current) return;
          setCover(cover);
          setCoverDraft(result, cover);
          setCoverMessage("登记成功后，可在作品详情页发布封面。");
        } catch {
          if (current === selection.current) setCoverMessage("无法生成封面，请检查文件格式、损坏或加密情况。");
        } finally {
          if (current === selection.current) setGenerating(false);
        }
      }
    } catch {
      if (current === selection.current)
        setFileMessage("读取文件失败，请重新选择");
    }
  }

  async function submit() {
    if (!valid || !address || !hash) return;
    const success = await transaction.run(() =>
      writeContractAsync({
        address,
        abi,
        functionName: "registerWork",
        chainId,
        args: [hash, title.trim(), description.trim(), category, 0],
      }),
    );
    if (success && client) {
      try {
        const id = await client.readContract({ address, abi, functionName: "activeWorkByHash", args: [hash] });
        navigate(`/works/${id}`);
      } catch { navigate("/discover"); }
    }
  }

  return (
    <>
      <PageHeading title={t("登记作品")}>
        {t("文件仅在浏览器本地计算 SHA-256，不上传原始文件。")}
      </PageHeading>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <Panel title={t("作品文件")}>
          <div className="flex min-w-0 flex-col gap-2 text-sm">
            <label htmlFor="work-file" className="font-medium">
              {t("选择文件")}
            </label>
            <input
              id="work-file"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.txt,.pdf,.mp3,.wav,.mp4"
              onChange={(event) => void choose(event.currentTarget.files?.[0])}
            />
            <p className="text-xs text-muted">
              {t(
                "PNG / JPG / WEBP / TXT / PDF / MP3 / WAV / MP4，最大 20 MiB",
              )}
            </p>
            <div
              aria-live="polite"
              className="flex min-h-10 items-center rounded-lg border border-border bg-background px-3 text-sm"
            >
              {file ? (
                <span className="truncate" title={file.name}>
                  {file.name}
                </span>
              ) : (
                <span className="text-muted">{t("尚未选择文件")}</span>
              )}
            </div>
          </div>
          <Notice>{fileMessage}</Notice>
          {preview && <img src={preview} alt={t("待发布封面预览")} className="h-64 w-full rounded-xl border border-border bg-background object-contain" />}
          <Notice>{coverMessage}</Notice>
          {hash && (
            <div className="space-y-2 text-sm">
              <p className="text-muted">{t("文件 SHA-256")}</p>
              <code className="block break-all text-xs">{hash}</code>
              <p>
                {isFetching
                  ? t("正在检查重复登记…")
                  : error
                    ? t("重复检查失败，请检查网络。")
                    : existingId
                      ? t("已有有效登记：#{id}", { id: existingId })
                      : t("未发现有效登记")}
              </p>
            </div>
          )}
        </Panel>
        <Panel title={t("登记信息")}>
          <Field
            label={t("作品标题")}
            hint={t("{count} / {limit} 字节", {
              count: utf8Bytes(title.trim()),
              limit: 96,
            })}
          >
            <FormInput
              className="w-full"
              value={title}
              maxLength={96}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field
            label={t("简介（可选）")}
            hint={t("{count} / {limit} 字节", {
              count: utf8Bytes(description.trim()),
              limit: 512,
            })}
          >
            <FormTextArea
              className="w-full"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <Field label={t("作品类别")}>
            <FormSelect
              label={t("作品类别")}
              value={String(category)}
              onChange={(value) => setCategory(Number(value))}
              options={categories.slice(1).map((name, index) => ({
                value: String(index + 1),
                label: t(name),
              }))}
            />
          </Field>
          <CheckField isSelected={agree} onChange={setAgree}>
            {t(
              "我拥有登记和授权所需的权利，并理解登记记录不代表平台证明真实版权归属。",
            )}
          </CheckField>
          {!isConnected && <Notice>{t("请先连接 MetaMask 钱包。")}</Notice>}
          <Notice>{transaction.message}</Notice>
          <Button isDisabled={!valid || transaction.busy} onPress={submit}>
            {transaction.busy ? t("登记中…") : t("签名并登记")}
          </Button>
        </Panel>
      </div>
    </>
  );
}
