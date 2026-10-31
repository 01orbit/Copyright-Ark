import { useLanguage } from "../i18n";
import { Button } from "@heroui/react";
import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  useAccount,
  useConnect,
  useDisconnect,
} from "wagmi";
import { shorten } from "../domain";
import { localChainEnabled } from "../config";
import { useMarket, useNetwork } from "../market";
import { FormSelect, Notice } from "./ui";
import Brand from "./Brand";
import LanguageSwitch from "./LanguageSwitch";

const navigation = [
  ["/discover", "发现作品"],
  ["/register", "登记作品"],
  ["/offers", "个人挂单"],
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
  const { chainId, walletChainId } = useMarket();
  const { selectChain, switching, switchError } = useNetwork();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isConnected ? (
        <>
          {localChainEnabled ? <FormSelect
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
          /> : walletChainId !== 11155111 ? (
            <Button size="sm" variant="outline" isDisabled={switching} onPress={() => selectChain(11155111)}>
              {t("切换到 Sepolia")}
            </Button>
          ) : <span className="text-xs text-muted">Sepolia</span>}
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
  const navigationRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navigationRef.current;
    if (!nav) return;
    const scrollMenu = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const distance = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? nav.clientWidth : 1);
      const next = Math.max(0, Math.min(nav.scrollWidth - nav.clientWidth, nav.scrollLeft + distance));
      if (next === nav.scrollLeft) return;
      event.preventDefault();
      nav.scrollLeft = next;
    };
    nav.addEventListener("wheel", scrollMenu, { passive: false });
    return () => nav.removeEventListener("wheel", scrollMenu);
  }, []);
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-surface py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 lg:flex-nowrap">
          <Link
            to="/"
            aria-label={t("Copyright Ark 首页 · 版权管理平台")}
            className="flex shrink-0 items-center gap-2.5 rounded-lg font-semibold"
          >
            <Brand />
          </Link>
          {/* 滚动条延伸到导航行下方，不占用菜单的垂直居中空间。 */}
          <div className="relative order-last h-9 w-full min-w-0 lg:order-none lg:w-auto lg:flex-1">
            <nav
              ref={navigationRef}
              aria-label={t("主导航")}
              className="nav-scrollbar absolute inset-x-0 top-0 -bottom-2.5 flex items-start gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain"
            >
              {navigation.map(([path, label]) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex h-9 shrink-0 items-center px-3 text-base font-medium transition-colors ${path === "/dev" ? "text-violet-700 hover:text-violet-800" : isActive ? "text-accent" : "text-muted hover:text-foreground"}`
                  }
                >
                  {t(label)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-3">
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
