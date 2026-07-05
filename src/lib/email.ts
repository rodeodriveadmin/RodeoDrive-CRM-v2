import "server-only";

// Email provider abstraction (same pattern as src/lib/sms.ts).
// - RESEND_API_KEY set  → real sends through the Resend HTTPS API (no SDK).
// - not set             → null provider, results recorded as SIMULATED.
// EMAIL_FROM sets the sender, e.g. "Rodeo Drive CRM <crm@rodeodrive.work>".

export interface EmailSendResult {
  status: "SIMULATED" | "SENT" | "FAILED";
  providerName: string;
  error?: string;
}

export interface EmailProvider {
  name: string;
  send(to: string, subject: string, html: string): Promise<EmailSendResult>;
}

const nullProvider: EmailProvider = {
  name: "none",
  async send() {
    return { status: "SIMULATED", providerName: "none" };
  },
};

const resendProvider: EmailProvider = {
  name: "resend",
  async send(to, subject, html) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
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
