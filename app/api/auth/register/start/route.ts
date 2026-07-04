import { NextResponse } from "next/server";
import { otpStartSchema } from "@/lib/schemas/auth-api";
import { toE164 } from "@/lib/auth/phone";
import { createAdminClient } from "@/lib/server/admin";
import { issueOtp } from "@/lib/server/otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = otpStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "შეიყვანეთ სწორი მობილურის ნომერი" },
      { status: 400 },
    );
  }

  const phone = toE164(parsed.data.phone);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "ეს ნომერი უკვე რეგისტრირებულია — სცადეთ შესვლა" },
      { status: 409 },
    );
  }

  const result = await issueOtp(
    admin,
    parsed.data.phone,
    "register",
    request.headers.get("host"),
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.reason },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
