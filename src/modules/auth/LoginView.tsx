"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Button, Input, Label } from "@/components/ui";
import "./login.css";

export function LoginView() {
  const { t, toggleLang } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function errorText(message: string | undefined, code: string | undefined): string {
    const raw = message ?? code ?? "";
    if (raw.includes("ACCOUNT_BLOCKED")) return t("login.blocked");
    if (raw.includes("ACCOUNT_DISABLED")) return t("login.disabled");
    const attempts = raw.match(/INVALID_CREDENTIALS:(\d+)/);
    if (attempts) return t("login.attemptsLeft").replace("%s", attempts[1]);
    return t("login.failed");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn.email({ email, password });
    setBusy(false);
    if (error) {
      setError(errorText(error.message, error.code));
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="login">
      <div className="login__box">
        <div className="login__head">
          <div className="login__logo brand-logo" role="img" aria-label={t("app.name")} />
          <h1 className="login__title">{t("app.name")}</h1>
          <p className="login__subtitle">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="login__form">
          <div className="login__field">
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="login__field">
            <Label htmlFor="password">{t("login.password")}</Label>
            <div className="login__password">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login__eye"
                title={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
              </button>
            </div>
          </div>
          {error && <p className="login__error" role="alert">{error}</p>}
          <Button type="submit" disabled={busy} className="btn--block">
            {busy ? t("common.loading") : t("login.submit")}
          </Button>
          <Link href="/forgot-password" className="login__forgot">
            {t("login.forgot")}
          </Link>
        </form>

        <button onClick={toggleLang} className="login__lang">
          {t("common.language")}
        </button>
      </div>
    </main>
  );
}
