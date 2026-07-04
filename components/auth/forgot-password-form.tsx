"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toAuthEmail } from "@/lib/auth/phone";
import {
  fieldErrors,
  forgotPasswordSchema,
  updatePasswordSchema,
} from "@/lib/schemas/auth";
import {
  startPasswordReset,
  verifyPasswordReset,
} from "@/lib/services/auth-api";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PhoneInput } from "@/components/auth/phone-input";
import { PasswordInput } from "@/components/auth/password-input";
import { OtpVerifyStep } from "@/components/auth/otp-verify-step";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    const { error } = await startPasswordReset(parsed.data.phone);
    setIsLoading(false);

    if (error) {
      setAuthError(error);
      return;
    }
    setStep("verify");
  };

  const handleVerify = async (code: string) => {
    const parsed = updatePasswordSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return { error: "შეავსეთ ახალი პაროლის ველები" };
    }
    setErrors({});

    const { error } = await verifyPasswordReset({
      phone,
      code,
      password: parsed.data.password,
    });
    if (error) {
      return { error };
    }

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: toAuthEmail(phone),
      password: parsed.data.password,
    });
    if (loginError) {
      return { error: "პაროლი განახლდა — შედით ლოგინის გვერდიდან" };
    }

    router.push("/");
    router.refresh();
    return { error: null };
  };

  if (step === "verify") {
    return (
      <OtpVerifyStep
        phone={phone}
        title="პაროლის აღდგენა"
        submitLabel="პაროლის შეცვლა"
        onVerify={handleVerify}
        onResend={() => startPasswordReset(phone)}
        onBack={() => setStep("phone")}
      >
        <FormField
          id="new-password"
          label="ახალი პაროლი"
          error={errors.password}
          hint="მინიმუმ 8 სიმბოლო"
        >
          <PasswordInput
            id="new-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
          />
        </FormField>
        <FormField
          id="confirm-new-password"
          label="გაიმეორეთ პაროლი"
          error={errors.confirmPassword}
        >
          <PasswordInput
            id="confirm-new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            invalid={Boolean(errors.confirmPassword)}
          />
        </FormField>
      </OtpVerifyStep>
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
