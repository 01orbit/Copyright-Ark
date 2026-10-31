import { useLanguage } from "../i18n";
import { Button } from "@heroui/react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
} from "wagmi";
import { shorten } from "../domain";
import { useMarket, useNetwork } from "../market";
import { FormSelect, Notice } from "./ui";
import Brand from "./Brand";
import LanguageSwitch from "./LanguageSwitch";

const navigation = [
  ["/discover", "发现作品"],
  ["/register", "登记作品"],
  ["/offers", "授权挂单"],
  ["/verify", "使用权查询"],
  ["/account", "我的账户"],
  ["/admin", "管理台"],
  ["/dev", "开发者菜单"],
];

export function WalletButton() {
  const { t } = useLanguage();
  const { address, isConnected } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { selectChain, switching, switchError } = useNetwork();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isConnected ? (
        <>
          <FormSelect
            label={t("钱包网络")}
            className="w-32"
            value={String(chainId)}
            isDisabled={switching}
            onChange={(value) =>
              selectChain(Number(value) as 31337 | 11155111)
            }
            options={[
              { value: "31337", label: t("本地链") },
              { value: "11155111", label: "Sepolia" },
            ]}
          />
          <Button
            size="sm"
            variant="outline"
            onPress={() => disconnect()}
            aria-label={t("断开钱包 {address}", { address: shorten(address) })}
          >
            {shorten(address)} {t("· 断开")}
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          isDisabled={isPending}
          onPress={() => connectors[0] && connect({ connector: connectors[0] })}
        >
          {isPending ? t("连接中…") : t("连接 MetaMask")}
        </Button>
      )}
      {(error || switchError) && (
        <span role="alert" className="text-xs text-danger">
          {t("钱包操作失败，请检查 MetaMask。")}
        </span>
      )}
    </div>
  );
}

export default function Layout() {
  const { t } = useLanguage();
  const { address, walletReady } = useMarket();
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 pt-4 2xl:flex-nowrap 2xl:pt-0">
          <Link
            to="/"
            aria-label={t("Copyright Ark 首页 · 版权管理平台")}
            className="flex shrink-0 items-center gap-2.5 rounded-lg font-semibold"
          >
            <Brand />
          </Link>
          <nav
            aria-label={t("主导航")}
            className="scrollbar-none order-last flex w-full min-w-0 gap-1 overflow-x-auto overflow-y-hidden 2xl:order-none 2xl:w-auto 2xl:flex-1"
          >
            {navigation.map(([path, label]) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `shrink-0 border-b-2 px-3 py-4 text-sm font-medium transition-colors xl:py-5 ${
                    isActive
                      ? "border-current"
                      : "border-transparent"
                  } ${path === "/dev" ? "text-violet-700 hover:text-violet-800" : isActive ? "text-accent" : "text-muted hover:text-foreground"}`
                }
              >
                {t(label)}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            <LanguageSwitch />
            <WalletButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-6 py-10">
        {!address && (
          <Notice>{t("该网络尚未配置合约，请检查部署地址。")}</Notice>
        )}
        {!walletReady && (
          <Notice>{t("请在 MetaMask 中切换到当前业务网络后再进行写操作。")}</Notice>
        )}
        <Outlet />
      </main>
    </div>
  );
}
