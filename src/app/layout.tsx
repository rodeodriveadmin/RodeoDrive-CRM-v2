import type { Metadata, Viewport } from "next";
import { Inter, Tajawal } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Lang } from "@/lib/i18n/dictionaries";
import "@/styles/base.css";
import "@/styles/components.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
});

// Organization theme: a plain CSS file in /public/themes/<org>.css that
// defines every design token (colors, logo, backgrounds). Swap brands by
// adding a CSS file and setting NEXT_PUBLIC_ORG_THEME — no code changes.
const ORG_THEME = process.env.NEXT_PUBLIC_ORG_THEME || "default";

export const metadata: Metadata = {
  title: { default: "Rodeo Drive CRM", template: "%s · Rodeo Drive CRM" },
  description: "Workshop management system",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value === "ar" ? "ar" : "en") as Lang;

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${inter.variable} ${tajawal.variable}`}>
      <head>
        <link rel="stylesheet" href={`/themes/${ORG_THEME}.css`} />
      </head>
      <body>
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
