"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Button, Input, Label } from "@/components/ui";
import "./login.css";

export function ForgotPasswordView() {
  const { t, toggleLang } = useLang();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await requestPasswordReset({
      email: email.trim().toLowerCase(),
      redirectTo: "/reset-password",
    });
    setBusy(false);
    if (error) {
      setError(t("common.error"));
      return;
    }
    // Same message whether or not the email exists — no account enumeration.
    setSent(true);
  }

  return (
    <main className="login">
      <div className="login__box">
        <div className="login__head">
          <div className="login__logo brand-logo" role="img" aria-label={t("app.name")} />
          <h1 className="login__title">{t("reset.requestTitle")}</h1>
          <p className="login__subtitle">{t("reset.requestSubtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="login__form">
          {sent ? (
            <p className="login__success" role="status">{t("reset.sent")}</p>
          ) : (
            <>
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
              {error && <p className="login__error" role="alert">{error}</p>}
              <Button type="submit" disabled={busy} className="btn--block">
                {busy ? t("common.loading") : t("reset.send")}
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
