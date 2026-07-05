import "server-only";

// SMS provider abstraction. No provider is configured yet, so the null
// provider "sends" nothing and the sms cluster records the batch as
// SIMULATED. Plugging in Twilio/Unifonic/Msegat later means implementing
// this interface and switching on an env var — no UI changes.

export interface SmsSendResult {
  status: "SIMULATED" | "SENT" | "FAILED";
  providerName: string;
}

export interface SmsProvider {
  name: string;
  send(phones: string[], message: string): Promise<SmsSendResult>;
}

const nullProvider: SmsProvider = {
  name: "none",
  async send() {
    return { status: "SIMULATED", providerName: "none" };
  },
};

export function getSmsProvider(): SmsProvider {
  // e.g. switch (process.env.SMS_PROVIDER) { case "twilio": ... }
  return nullProvider;
}

/** Normalizes a phone number for dedupe: digits only, local 0-prefix kept. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, "").replace(/^\+/, "00");
}
