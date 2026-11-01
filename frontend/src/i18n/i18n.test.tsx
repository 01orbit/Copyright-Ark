// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LanguageProvider, readLanguage, translate, useLanguage } from "./index";
import english from "./en.json";
import LanguageSwitch from "../components/LanguageSwitch";
import { Notice } from "../components/ui";
import { categories, formatDate, licenseStatusLabel, offerStatusLabel, validateFile } from "../domain";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});
afterEach(() => vi.unstubAllGlobals());

it("covers page copy, dynamic categories and statuses with matching placeholders", () => {
  const sources = import.meta.glob<string>("../{pages,components}/*.tsx", { query: "?raw", import: "default", eager: true });
  const keys = Object.values(sources).flatMap((source) => [...source.matchAll(/\bt\("([^"\n]+)"/g)].map((match) => match[1]));
  keys.push(...categories.slice(1), "管理员", validateFile());
  for (let status = 0; status <= 6; status++) keys.push(offerStatusLabel(status), licenseStatusLabel(status));
  for (const key of keys) expect(english, key).toHaveProperty(key);
  for (const [key, value] of Object.entries(english)) {
    expect(value.match(/\{\w+\}/g)?.sort() ?? [], key).toEqual(key.match(/\{\w+\}/g)?.sort() ?? []);
  }
});

it("formats variable messages and dates without changing user content", () => {
  expect(translate("{count} 次授权", "en", { count: 3n })).toBe("3 licenses");
  expect(translate("我的作品 {title}", "en")).toBe("我的作品 {title}");
  expect(formatDate(1704067200, "en-US")).not.toBe(formatDate(1704067200, "zh-CN"));
  expect(readLanguage()).toBe("en");
});

it("defaults to English without a saved preference and remembers an explicit language choice", () => {
  localStorage.setItem("zhulu:language", "invalid");
  expect(readLanguage()).toBe("en");
  localStorage.removeItem("zhulu:language");
  expect(readLanguage()).toBe("en");
  localStorage.setItem("zhulu:language", "zh");
  expect(readLanguage()).toBe("zh");
});

it("switches live copy and existing messages, preserves drafts, and restores language after reload", async () => {
  function Draft() {
    const { t } = useLanguage();
    const [title, setTitle] = useState("我填写的作品标题");
    return <><label>{t("作品标题")}<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><Notice>交易已确认</Notice></>;
  }
  const host = document.createElement("div");
  document.body.append(host);
  let root = createRoot(host);
  const render = () => root.render(<LanguageProvider><LanguageSwitch /><Draft /></LanguageProvider>);
  try {
    await act(render);
    const input = host.querySelector("input");
    await act(() => host.querySelector<HTMLButtonElement>('[aria-label="Switch to English"]')!.click());
    expect(host.textContent).toContain("Work title");
    expect(host.textContent).toContain("Transaction confirmed");
    expect(host.querySelector("input")).toBe(input);
    expect(input?.value).toBe("我填写的作品标题");
    expect(document.documentElement.lang).toBe("en-US");
    expect(document.title).toBe("Copyright Ark · Copyright Management");
    await act(() => root.unmount());
    root = createRoot(host);
    await act(render);
    expect(host.textContent).toContain("Work title");
    await act(() => host.querySelector<HTMLButtonElement>('[aria-label="切换为中文"]')!.click());
    expect(host.textContent).toContain("作品标题");
    expect(document.documentElement.lang).toBe("zh-CN");
  } finally {
    await act(() => root.unmount());
    host.remove();
  }
});

it("falls back to English when browser storage is unavailable", () => {
  const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("disabled"); });
  expect(readLanguage()).toBe("en");
  read.mockRestore();
});
