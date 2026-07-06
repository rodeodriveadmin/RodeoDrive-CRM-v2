"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "@/lib/auth-client";
import { isPasswordValid } from "@/lib/password-policy";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Button, Input, Label } from "@/components/ui";
import "./login.css";

export function ResetPasswordView() {
  const { t, toggleLang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  // better-auth redirects here with ?error=INVALID_TOKEN when the link expired
  const linkInvalid = !token || !!params.get("error");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isPasswordValid(password)) {
      setError(t("common.passwordPolicy"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }
    setBusy(true);
    const { error } = await resetPassword({ newPassword: password, token: token! });
    setBusy(false);
    if (error) {
      setError(error.code === "INVALID_TOKEN" ? t("reset.invalidToken") : t("common.error"));
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/login"), 2500);
  }

  return (
    <main className="login">
      <div className="login__box">
        <div className="login__head">
          <div className="login__logo brand-logo" role="img" aria-label={t("app.name")} />
          <h1 className="login__title">{t("reset.title")}</h1>
          <p className="login__subtitle">{t("reset.subtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="login__form">
          {linkInvalid ? (
            <p className="login__error" role="alert">{t("reset.invalidToken")}</p>
          ) : done ? (
            <p className="login__success" role="status">{t("reset.success")}</p>
          ) : (
            <>
              <div className="login__field">
                <Label htmlFor="password">{t("reset.newPassword")}</Label>
                <div className="login__password">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
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
                <p className="login__hint">{t("common.passwordPolicy")}</p>
              </div>
              <div className="login__field">
                <Label htmlFor="confirm">{t("reset.confirmPassword")}</Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && <p className="login__error" role="alert">{error}</p>}
              <Button type="submit" disabled={busy} className="btn--block">
                {busy ? t("common.loading") : t("reset.submit")}
              </Button>
            </>
          )}
          <Link href="/login" className="login__forgot">
            {t("reset.backToLogin")}
          </Link>
        </form>

        <button onClick={toggleLang} className="login__lang">
          {t("common.language")}
        </button>
      </div>
    </main>
  );
}
