/* Phone number helpers shared by anywhere we render a call/WhatsApp action. */

/** Normalises a stored phone number into WhatsApp's expected digits-only,
 * country-code-prefixed format (e.g. "082 123 4567" -> "27821234567").
 * Assumes South African numbers when a local "0..." format is given. */
export function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("27")) return digits;
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  return digits;
}

export function toWhatsAppLink(phone: string): string {
  return `https://wa.me/${toWhatsAppDigits(phone)}`;
}
