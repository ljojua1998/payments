"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fieldErrors, forgotPasswordSchema } from "@/lib/schemas/auth";
import {
  startPasswordReset,
  verifyPasswordReset,
} from "@/lib/services/auth-api";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PhoneInput } from "@/components/auth/phone-input";
import { OtpDialog } from "@/components/auth/otp-dialog";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [otpOpen, setOtpOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    const parsed = forgotPasswordSchema.safeParse({ phone });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsLoading(true);

    const { error, code } = await startPasswordReset(parsed.data.phone);
    setIsLoading(false);

    if (error && code !== "cooldown") {
      setAuthError(error);
      return;
    }
    setOtpOpen(true);
  };

  const handleVerify = async (code: string) => {
    const { error, tokenHash } = await verifyPasswordReset({ phone, code });
    if (error || !tokenHash) {
      return { error: error ?? "შესვლა ვერ მოხერხდა — სცადეთ თავიდან" };
    }

    const supabase = createClient();
    const { error: sessionError } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    if (sessionError) {
      return { error: "შესვლა ვერ მოხერხდა — სცადეთ თავიდან" };
    }

    router.push("/settings");
    router.refresh();
    return { error: null };
  };

  return (
    <AuthCard
      title="პაროლის აღდგენა"
      description="შეიყვანეთ რეგისტრირებული ნომერი — SMS კოდით პირდაპირ შეხვალთ, პაროლს კი პარამეტრებში შეცვლით"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <AuthError message={authError} />

        <FormField id="phone" label="ტელეფონის ნომერი" error={errors.phone}>
          <PhoneInput
            id="phone"
            value={phone}
            onChange={setPhone}
            invalid={Boolean(errors.phone)}
            autoFocus
          />
        </FormField>

        <Button type="submit" size="lg" className="h-11" disabled={isLoading}>
          {isLoading ? "იგზავნება..." : "კოდის გაგზავნა"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          გაგახსენდათ პაროლი?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            შესვლა
          </Link>
        </p>
      </form>

      <OtpDialog
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        phone={phone}
        title="კოდით შესვლა"
        submitLabel="შესვლა"
        onVerify={handleVerify}
        onResend={() => startPasswordReset(phone)}
      />
    </AuthCard>
  );
}
