"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { dictionaries, type DictKey, type Lang } from "./dictionaries";

interface LanguageContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: (key: DictKey) => string;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: ReactNode;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);

  const t = useCallback((key: DictKey) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "ar" : "en";
      document.cookie = `lang=${next};path=/;max-age=31536000;samesite=lax`;
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
