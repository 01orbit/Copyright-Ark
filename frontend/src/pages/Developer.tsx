import { useLanguage } from "../i18n";
import { Button, Chip, Switch } from "@heroui/react";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import type { Address } from "viem";
import { localChainEnabled, marketAddress } from "../config";
import { abi, useMarket, useNetwork, useTransaction } from "../market";
import {
  Field,
  FormTextArea,
  Notice,
  PageHeading,
  Panel,
} from "../components/ui";
import {
  loadAccounts,
  resetAccounts,
  saveAccounts,
  validateAccounts,
  type TestAccounts,
  type TestChain,
} from "../dev/test-accounts";

export default function Developer() {
  const { t } = useLanguage();
  const { chainId, walletChainId } = useMarket();
  const { selectChain, switching, switchError } = useNetwork();
  const { address: wallet, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const transaction = useTransaction();
  const [chain, setChain] = useState<TestChain>(
    chainId === 31337 ? "31337" : "11155111",
  );
  const [accounts, setAccounts] = useState(() => loadAccounts(chain));
  const [message, setMessage] = useState("");
  const contract = marketAddress(chainId);
  const { data: owner, error: ownerError } = useReadContract({
    address: contract,
    abi,
    functionName: "owner",
    chainId,
    query: { enabled: !!contract },
  });
  const { data: onChainAdmins, error: adminsError } = useReadContract({
    address: contract,
    abi,
    functionName: "getAdmins",
    chainId,
    query: { enabled: !!contract },
  });
  const { data: walletIsAdmin } = useReadContract({
    address: contract,
    abi,
    functionName: "isAdmin",
    chainId,
    args: [wallet!],
    query: { enabled: !!contract && !!wallet },
  });
  const isOwner = !!wallet && !!owner && wallet.toLowerCase() === owner.toLowerCase();

  useEffect(() => {
    const next = chainId === 31337 ? "31337" : "11155111";
    setChain(next);
    setAccounts(loadAccounts(next));
    setMessage("");
  }, [chainId]);

  function update(action: () => TestAccounts, success: string) {
    try {
      setAccounts(action());
      setMessage(success);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : t("无法保存，请检查浏览器是否允许本地存储。"),
      );
    }
  }

  async function syncAdmins() {
    try {
      const normalized = validateAccounts(accounts);
      if (!contract || !isOwner) {
        setMessage(t("请连接当前链上 owner 钱包后再同步管理员。"));
        return;
      }
      const success = await transaction.run(() =>
        writeContractAsync({
          address: contract,
          abi,
          functionName: "setAdmins",
          chainId,
          args: [normalized.admin as Address[]],
        }),
      );
      if (success) {
        setAccounts(normalized);
        try {
          saveAccounts(chain, normalized);
        } catch {
          // The on-chain update remains valid when browser storage is unavailable.
        }
        setMessage(t("链上管理员名单已更新。"));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("管理员名单格式无效。"));
    }
  }

  return (
    <>
      <PageHeading title={t("开发者菜单")}>
        {t(
          "管理员权限配置 · Alt + Shift + D 打开 · 修改名单需要当前 owner 签名并写入链上。",
        )}
      </PageHeading>
      <Panel title={t("当前业务网络")}>
        {localChainEnabled ? <Switch
          isSelected={chainId === 31337}
          isDisabled={switching}
          onChange={(local) => selectChain(local ? 31337 : 11155111)}
          aria-label={t("切换业务网络")}
        >
          <Switch.Content className="gap-3">
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <span className="text-sm font-medium">
              {chainId === 31337 ? t("本地链") : "Sepolia"}
            </span>
          </Switch.Content>
        </Switch> : <Chip size="sm" variant="soft">Sepolia</Chip>}
        <p className="text-sm leading-relaxed text-muted">
          {t(
            localChainEnabled
              ? "切换后，发现、登记、授权、查询、账户和管理台都会读取并操作所选网络的合约。"
              : "线上版本固定使用 Sepolia。本地链测试请在本机启动前端。",
          )}
        </p>
        {isConnected && walletChainId !== chainId && (
          <Notice>{t("请在 MetaMask 中确认切换到当前业务网络。")}</Notice>
        )}
        {switchError && <Notice>{t("钱包切网失败，请检查 MetaMask。")}</Notice>}
      </Panel>
      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <Panel title={t("管理员地址")}>
          <p className="text-sm text-muted">
            {t("当前配置网络：")} {chain === "31337" ? t("本地链") : "Sepolia"}
          </p>
          <p className="text-sm text-muted">
            {t("填写要授权的管理员公开地址，每行一个；提交后由当前 owner 签名写入合约。不要填写私钥或助记词。")}
          </p>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void syncAdmins();
            }}
          >
            <Field label={t("管理员地址")}>
              <FormTextArea
                className="w-full font-mono text-sm"
                value={accounts.admin.join("\n")}
                placeholder={t("每行一个 0x…（可留空）")}
                rows={3}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => {
                  const addresses = event.target.value
                    .split(/[\s,]+/)
                    .map((address) => address.trim())
                    .filter(Boolean);
                  setAccounts({ admin: addresses });
                  setMessage("");
                }}
              />
            </Field>
            <Notice>{transaction.message || message}</Notice>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" isDisabled={!isOwner || transaction.busy}>
                {transaction.busy ? t("同步中…") : t("同步链上管理员")}
              </Button>
              <Button
                variant="outline"
                onPress={() =>
                  update(
                    () => resetAccounts(chain),
                    t("已恢复当前网络的本地默认配置。"),
                  )
                }
              >
                {t("恢复默认")}
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted">
            {t(
              "管理员名单会写入当前网络的合约；本地浏览器仍会保存一份地址草稿，方便下次编辑。删除地址并同步即可撤销其管理员权限。",
            )}
          </p>
        </Panel>
        <Panel title={t("钱包核对")}>
          <p className="text-sm text-muted">{t("当前连接的 MetaMask 账户")}</p>
          <p className="break-all font-mono text-sm">
            {wallet || t("尚未连接，请使用顶部钱包按钮连接。")}
          </p>
          <div className="flex flex-wrap gap-2">
            {walletIsAdmin && (
              <Chip size="sm" variant="soft">
                {t("当前钱包已获管理员权限")}
              </Chip>
            )}
            {wallet && walletIsAdmin === false && (
              <span className="text-sm text-muted">
                {t("当前钱包尚未获管理员权限。")}
              </span>
            )}
          </div>
          {wallet && walletChainId !== chainId && (
            <Notice>
              {t(
                "当前钱包网络与正在编辑的配置网络不同，请在顶部切换钱包网络。",
              )}
            </Notice>
          )}
          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <p className="text-muted">{t("所选网络的链上管理员（owner）")}</p>
            <p className="break-all font-mono">
              {!contract
                ? t("尚未配置该网络的合约。")
                : ownerError
                  ? t("读取失败，请检查 RPC。")
                  : owner || t("正在读取…")}
            </p>
            <p className="pt-2 text-muted">{t("已授权的额外管理员")}</p>
            {adminsError ? (
              <Notice>{t("管理员名单读取失败，请检查 RPC。")}</Notice>
            ) : onChainAdmins?.length ? (
              onChainAdmins.map((address) => (
                <p key={address} className="break-all font-mono text-sm">
                  {address}
                </p>
              ))
            ) : (
              <p className="text-muted">{t("暂无额外管理员，只有 owner 可以管理案件。")}</p>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted">
            {t(
              "连接钱包后，每笔操作仍须由 MetaMask 签名，并由合约检查真实权限。此菜单不是登录或授权入口。",
            )}
          </p>
        </Panel>
      </div>
    </>
  );
}
