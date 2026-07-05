// PCI DSS guard: this system must NEVER store cardholder data (PAN, CVV,
// magnetic-stripe contents). Card payments are handled by an external,
// PCI-certified payment gateway; we only keep gateway references.
//
// This module detects card-number-like input in free-text fields (payment
// references, notes, descriptions) so a PAN can never be persisted by
// accident. Every payments-cluster mutation must run its text inputs
// through assertNoCardData().

const CANDIDATE = /(?:\d[ -]?){13,19}/g;

function luhnValid(digits: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

/** Returns true when the text contains something that looks like a card number. */
export function containsCardData(text: string | null | undefined): boolean {
  if (!text) return false;
  const matches = text.match(CANDIDATE);
  if (!matches) return false;
  return matches.some((m) => {
    const digits = m.replace(/[ -]/g, "");
    return digits.length >= 13 && digits.length <= 19 && luhnValid(digits);
  });
}

export class CardDataError extends Error {
  constructor() {
    super("CARD_DATA_NOT_ALLOWED");
    this.name = "CardDataError";
  }
}

/** Throws when any of the given text fields contains card-number-like data. */
export function assertNoCardData(...fields: Array<string | null | undefined>): void {
  for (const f of fields) {
    if (containsCardData(f)) throw new CardDataError();
  }
}

/** Masks anything card-like for safe logging (keeps last 4 digits). */
export function maskCardData(text: string): string {
  return text.replace(CANDIDATE, (m) => {
    const digits = m.replace(/[ -]/g, "");
    if (digits.length < 13 || digits.length > 19 || !luhnValid(digits)) return m;
    return `**** **** **** ${digits.slice(-4)}`;
  });
}
