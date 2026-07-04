"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toE164 } from "@/lib/auth/phone";
import { fieldErrors, forgotPasswordSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PhoneInput } from "@/components/auth/phone-input";
import { OtpVerifyStep } from "@/components/auth/otp-verify-step";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendCode = async (digits: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: toE164(digits),
      options: { shouldCreateUser: false },
    });
    return error;
  };

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

    const error = await sendCode(parsed.data.phone);
    setIsLoading(false);

    if (error) {
      setAuthError(
        error.message.includes("Signups not allowed")
          ? "ეს ნომერი რეგისტრირებული არ არის"
          : "კოდის გაგზავნა ვერ მოხერხდა — სცადეთ მოგვიანებით",
      );
      return;
    }

    setStep("verify");
  };

  if (step === "verify") {
    return (
      <OtpVerifyStep
        phone={phone}
        title="კოდის შეყვანა"
        onVerified={() => {
          router.push("/auth/update-password");
          router.refresh();
        }}
        onResend={async () => {
          const error = await sendCode(phone);
          return {
            error: error
              ? "კოდის გაგზავნა ვერ მოხერხდა — სცადეთ მოგვიანებით"
              : null,
          };
        }}
        onBack={() => setStep("phone")}
      />
    );
  }

  return (
    <AuthCard
      title="პაროლის აღდგენა"
      description="შეიყვანეთ რეგისტრირებული ნომერი — გამოგიგზავნით დადასტურების კოდს"
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
    </AuthCard>
  );
}
