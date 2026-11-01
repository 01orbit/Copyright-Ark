import { useLanguage } from "../i18n";
import { Button, Chip, Switch } from "@heroui/react";
import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { localChainEnabled, marketAddress } from "../config";
import { abi, useMarket, useNetwork } from "../market";
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
  type TestAccounts,
  type TestChain,
} from "../dev/test-accounts";

export default function Developer() {
  const { t } = useLanguage();
  const { chainId, walletChainId } = useMarket();
  const { selectChain, switching, switchError } = useNetwork();
  const { address: wallet, isConnected } = useAccount();
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
  const isConfiguredAdmin = Boolean(
    wallet &&
      accounts.admin.some(
        (address) => address.toLowerCase() === wallet.toLowerCase(),
      ),
  );

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
          : "无法保存，请检查浏览器是否允许本地存储。",
      );
    }
  }

  return (
    <>
      <PageHeading title={t("开发者菜单")}>
        {t(
          "管理员地址配置 · Alt + Shift + D 打开 · 地址仅用于核对提示，不改变链上权限。",
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
            {t("可填写多个管理员公开地址，每行一个；作者和买家可使用任意连接的钱包。不要填写私钥或助记词。")}
          </p>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              update(
                () => saveAccounts(chain, accounts),
                "已保存到当前浏览器，刷新后仍然有效。",
              );
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
            <Notice>{message}</Notice>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">{t("保存覆盖配置")}</Button>
              <Button
                variant="outline"
                onPress={() =>
                  update(
                    () => resetAccounts(chain),
                    "已恢复当前网络的默认配置。",
                  )
                }
              >
                {t("恢复默认")}
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted">
            {t(
              "仅对本浏览器、当前网站生效。不会写回配置文件，也不会上传服务器；更换浏览器或清除网站数据后恢复默认。",
            )}
          </p>
        </Panel>
        <Panel title={t("钱包核对")}>
          <p className="text-sm text-muted">{t("当前连接的 MetaMask 账户")}</p>
          <p className="break-all font-mono text-sm">
            {wallet || t("尚未连接，请使用顶部钱包按钮连接。")}
          </p>
          <div className="flex flex-wrap gap-2">
            {isConfiguredAdmin && (
              <Chip size="sm" variant="soft">
                {t("匹配管理员地址")}
              </Chip>
            )}
            {wallet && !isConfiguredAdmin && (
              <span className="text-sm text-muted">
                {t("当前钱包不是配置的管理员地址。")}
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
            {owner &&
              accounts.admin.length > 0 &&
              !accounts.admin.some(
                (address) => address.toLowerCase() === owner.toLowerCase(),
              ) && (
                <Notice>
                  {t(
                    "填写的管理员地址与链上 owner 不同。保存配置不会授予管理权限。",
                  )}
                </Notice>
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
