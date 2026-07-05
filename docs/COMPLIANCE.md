# PCI DSS Compliance Posture

This CRM records payments but is designed to stay **out of PCI DSS scope as far as possible**
(SAQ-A style posture): cardholder data never touches our servers or database.

## Hard rules (enforced in code)

1. **Never store cardholder data.** No PAN (card number), no CVV, no expiry, no track data —
   not even encrypted. The database schema has no card fields, and
   `src/lib/compliance/pci.ts` (`assertNoCardData`) rejects card-number-like input
   (Luhn-validated) in free-text fields such as payment references and notes, so a PAN
   cannot be saved by accident. `maskCardData` is available for safe logging.
2. **Card payments go through a certified gateway.** When online card payment is added,
   use a PCI DSS certified provider (Stripe, Checkout.com, Tap, HyperPay, …) with a
   hosted payment page or tokenizing fields. We store only: gateway transaction id,
   amount, currency, status, last-4 + brand (allowed by PCI), timestamps.
3. **TLS everywhere.** Production runs behind HTTPS only; HSTS is sent on every response
   (`next.config.ts` security headers). Session cookies are httpOnly + secure + SameSite.
4. **Access control & accountability.**
   - Role-based access control checked **server-side** on every mutation (`requirePolicy`).
   - Unique account per user; no shared logins. Admins create accounts (no self sign-up).
   - Deactivating a user kills their sessions immediately.
   - Every meaningful mutation is written to the `activity_logs` audit trail
     (who, what, when) — PCI DSS Requirement 10.
5. **Passwords** are hashed with scrypt (Better Auth default); minimum length enforced;
   admin resets invalidate all existing sessions.

## Operational checklist (deployment)

- [ ] HTTPS with a valid certificate on the public domain (platform-managed on Railway/Vercel).
- [ ] `BETTER_AUTH_SECRET` is long and random; never committed.
- [ ] Database reachable only from the app (private networking), not the public internet.
- [ ] Automated database backups enabled; restores tested.
- [ ] Root admin password changed from the seeded value on first login.
- [ ] When the payments module goes live with cards: gateway webhooks verified by signature,
      and the annual SAQ-A questionnaire completed with the gateway's attestation.
