import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { I18nProvider } from "react-aria";
import english from "./en.json";

export type Language = "zh" | "en";
type Params = Record<string, string | number | bigint>;
const storageKey = "zhulu:language";

export function translate(
  text: string,
  language: Language,
  params: Params = {},
) {
  const message =
    language === "en"
      ? ((english as Record<string, string>)[text] ?? text)
      : text;
  return message.replace(/\{(\w+)\}/g, (token, key: string) =>
    String(params[key] ?? token),
  );
}

export function readLanguage(): Language {
  try {
    return localStorage.getItem(storageKey) === "zh" ? "zh" : "en";
  } catch {
    return "en";
  }
}

const LanguageContext = createContext({
  language: "en" as Language,
  locale: "en-US",
  setLanguage: (_language: Language) => {},
  t: (text: string, params?: Params) => translate(text, "en", params),
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(readLanguage);
  const locale = language === "zh" ? "zh-CN" : "en-US";
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate("Copyright Ark · 版权管理平台", language);
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // Switching still works when browser storage is disabled.
    }
  }, [language, locale]);
  return (
    <LanguageContext.Provider
      value={{
        language,
        locale,
        setLanguage,
        t: (text, params) => translate(text, language, params),
      }}
    >
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </LanguageContext.Provider>
  );
}
