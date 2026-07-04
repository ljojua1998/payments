export const GEORGIAN_MOBILE_PATTERN = /^5\d{8}$/;

export function stripPhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

export function formatPhoneDisplay(digits: string): string {
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ];
  return parts.filter(Boolean).join(" ");
}

export function toE164(digits: string): string {
  return `+995${digits}`;
}

export function toAuthEmail(digits: string): string {
  return `995${digits}@sms.balansi.app`;
}
