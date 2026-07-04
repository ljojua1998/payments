import { NextResponse } from "next/server";
import { resetVerifySchema } from "@/lib/schemas/auth-api";
import { toAuthEmail, toE164 } from "@/lib/auth/phone";
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

  const { phone, code } = parsed.data;
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

  const { data: link, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: toAuthEmail(phone),
    });

  if (linkError || !link.properties?.hashed_token) {
    return NextResponse.json(
      { error: "შესვლა ვერ მოხერხდა — სცადეთ თავიდან" },
      { status: 500 },
    );
  }

  return NextResponse.json({ tokenHash: link.properties.hashed_token });
}
