/** Exactly ten digits. Matches what the booking form asks for; the server accepts 10-15. */
export function isValidMobile(value: string): boolean {
  return /^\d{10}$/.test(String(value ?? "").replace(/\s|-/g, ""));
}
