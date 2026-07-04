import { NextResponse } from "next/server";
import { resetVerifySchema } from "@/lib/schemas/auth-api";
import { toE164 } from "@/lib/auth/phone";
import { createAdminClient } from "@/lib/server/admin";
import { verifyOtp } from "@/lib/server/otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "მონაცემები არასრულია — შეავსეთ ფორმა თავიდან" },
      { status: 400 },
    );
  }

  const { phone, code, password } = parsed.data;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", toE164(phone))
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "ეს ნომერი რეგისტრირებული არ არის" },
      { status: 404 },
    );
  }

  const verification = await verifyOtp(admin, phone, "reset", code);
  if (!verification.ok) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status },
    );
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    profile.id,
    { password },
  );

  if (updateError) {
    return NextResponse.json(
      { error: "პაროლის განახლება ვერ მოხერხდა — სცადეთ თავიდან" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
