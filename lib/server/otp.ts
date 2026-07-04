import { createHash, randomInt } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendSms } from "@/lib/server/sms";

const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 55;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

export type OtpPurpose = "register" | "reset";

type OtpResult = { ok: true } | { ok: false; error: string; status: number };

function hashCode(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

export async function issueOtp(
  admin: SupabaseClient,
  phone: string,
  purpose: OtpPurpose,
): Promise<OtpResult> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent, error: recentError } = await admin
    .from("phone_otps")
    .select("created_at")
    .eq("phone", phone)
    .eq("purpose", purpose)
    .gte("created_at", hourAgo)
    .order("created_at", { ascending: false });

  if (recentError) {
    return { ok: false, error: "დროებითი შეფერხება — სცადეთ თავიდან", status: 500 };
  }

  if (recent.length >= MAX_SENDS_PER_HOUR) {
    return {
      ok: false,
      error: "კოდის ლიმიტი ამოიწურა — სცადეთ ერთ საათში",
      status: 429,
    };
  }

  const lastSentAt = recent[0]?.created_at;
  if (
    lastSentAt &&
    Date.now() - new Date(lastSentAt).getTime() < RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return {
      ok: false,
      error: "კოდი უკვე გაიგზავნა — დაელოდეთ და სცადეთ ხელახლა",
      status: 429,
    };
  }

  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(
    Date.now() + OTP_TTL_MINUTES * 60 * 1000,
  ).toISOString();

  const { error: insertError } = await admin.from("phone_otps").insert({
    phone,
    purpose,
    code_hash: hashCode(phone, code),
    expires_at: expiresAt,
  });

  if (insertError) {
    return { ok: false, error: "დროებითი შეფერხება — სცადეთ თავიდან", status: 500 };
  }

  try {
    await sendSms(phone, `ბალანსი: თქვენი დადასტურების კოდია ${code}`);
  } catch {
    return {
      ok: false,
      error: "SMS-ის გაგზავნა ვერ მოხერხდა — სცადეთ მოგვიანებით",
      status: 502,
    };
  }

  return { ok: true };
}

export async function verifyOtp(
  admin: SupabaseClient,
  phone: string,
  purpose: OtpPurpose,
  code: string,
): Promise<OtpResult> {
  const { data: otp, error } = await admin
    .from("phone_otps")
    .select("id, code_hash, attempts, expires_at")
    .eq("phone", phone)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "დროებითი შეფერხება — სცადეთ თავიდან", status: 500 };
  }

  const invalidCode = {
    ok: false as const,
    error: "კოდი არასწორია ან ვადა გაუვიდა — სცადეთ თავიდან",
    status: 400,
  };

  if (!otp || new Date(otp.expires_at).getTime() < Date.now()) {
    return invalidCode;
  }

  if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
    return {
      ok: false,
      error: "ცდების ლიმიტი ამოიწურა — მოითხოვეთ ახალი კოდი",
      status: 429,
    };
  }

  if (otp.code_hash !== hashCode(phone, code)) {
    await admin
      .from("phone_otps")
      .update({ attempts: otp.attempts + 1 })
      .eq("id", otp.id);
    return invalidCode;
  }

  await admin
    .from("phone_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", otp.id);

  return { ok: true };
}
