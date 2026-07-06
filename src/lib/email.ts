import "server-only";

// Email provider abstraction (same pattern as src/lib/sms.ts).
// - RESEND_API_KEY set  → real sends through the Resend HTTPS API (no SDK).
// - not set             → null provider, results recorded as SIMULATED.
// Senders:
// - EMAIL_FROM      default sender (reports), e.g. "Rodeo Drive CRM <reports@rodeodrive.com.qa>"
// - EMAIL_FROM_CRM  transactional sender (password reset, invitations),
//                   e.g. "Rodeo Drive CRM <crm@rodeodrive.com.qa>" — used via options.from

export interface EmailSendResult {
  status: "SIMULATED" | "SENT" | "FAILED";
  providerName: string;
  error?: string;
}

export interface EmailSendOptions {
  from?: string; // overrides EMAIL_FROM for this send
}

export interface EmailProvider {
  name: string;
  send(to: string, subject: string, html: string, options?: EmailSendOptions): Promise<EmailSendResult>;
}

/** Sender for auth/transactional mail (reset links, invitations). */
export function crmSender(): string | undefined {
  return process.env.EMAIL_FROM_CRM || process.env.EMAIL_FROM;
}

const nullProvider: EmailProvider = {
  name: "none",
  async send(to, subject, html, options) {
    // dev visibility: surface any action link so flows (e.g. password
    // reset) can be exercised without a configured provider
    const link = html.match(/href="([^"]+)"/)?.[1];
    const from = options?.from || process.env.EMAIL_FROM || "(default)";
    console.log(`[email SIMULATED] from=${from} to=${to} subject="${subject}"${link ? `\n[email SIMULATED] link: ${link}` : ""}`);
    return { status: "SIMULATED", providerName: "none" };
  },
};

const resendProvider: EmailProvider = {
  name: "resend",
  async send(to, subject, html, options) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: options?.from || process.env.EMAIL_FROM || "onboarding@resend.dev",
          to: [to],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { status: "FAILED", providerName: "resend", error: `${res.status}: ${body.slice(0, 300)}` };
      }
      return { status: "SENT", providerName: "resend" };
    } catch (err) {
      return {
        status: "FAILED",
        providerName: "resend",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};

export function getEmailProvider(): EmailProvider {
  return process.env.RESEND_API_KEY ? resendProvider : nullProvider;
}
