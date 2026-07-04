import { NextResponse } from "next/server";
import { registerVerifySchema } from "@/lib/schemas/auth-api";
import { toAuthEmail, toE164 } from "@/lib/auth/phone";
import { createAdminClient } from "@/lib/server/admin";
import { verifyOtp } from "@/lib/server/otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "მონაცემები არასრულია — შეავსეთ ფორმა თავიდან" },
      { status: 400 },
    );
  }

  const { phone, code, fullName, password } = parsed.data;
  const admin = createAdminClient();

  const verification = await verifyOtp(admin, phone, "register", code);
  if (!verification.ok) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status },
    );
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: toAuthEmail(phone),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: toE164(phone),
      },
    });

  if (createError) {
    const alreadyExists = createError.message
      .toLowerCase()
      .includes("already");
    return NextResponse.json(
      {
        error: alreadyExists
          ? "ეს ნომერი უკვე რეგისტრირებულია — სცადეთ შესვლა"
          : "რეგისტრაცია ვერ მოხერხდა — სცადეთ თავიდან",
      },
      { status: alreadyExists ? 409 : 500 },
    );
  }

  await admin
    .from("profiles")
    .upsert({
      id: created.user.id,
      full_name: fullName,
      phone: toE164(phone),
    });

  return NextResponse.json({ ok: true });
}
