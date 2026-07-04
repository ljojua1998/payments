"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toAuthEmail } from "@/lib/auth/phone";
import { fieldErrors, signUpSchema } from "@/lib/schemas/auth";
import { startRegistration, verifyRegistration } from "@/lib/services/auth-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PhoneInput } from "@/components/auth/phone-input";
import { PasswordInput } from "@/components/auth/password-input";
import { OtpDialog } from "@/components/auth/otp-dialog";

export function SignUpForm() {
  const router = useRouter();
  const [otpOpen, setOtpOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    const parsed = signUpSchema.safeParse({
      fullName,
      phone,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsLoading(true);

    const { error } = await startRegistration(parsed.data.phone);
    setIsLoading(false);

    if (error) {
      setAuthError(error);
      return;
    }
    setOtpOpen(true);
  };

  const handleVerify = async (code: string) => {
    const { error } = await verifyRegistration({
      phone,
      code,
      fullName: fullName.trim(),
      password,
    });
    if (error) {
      return { error };
    }

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: toAuthEmail(phone),
      password,
    });
    if (loginError) {
      return { error: "ანგარიში შეიქმნა — შედით ლოგინის გვერდიდან" };
    }

    router.push("/");
    router.refresh();
    return { error: null };
  };

  return (
    <AuthCard
      title="რეგისტრაცია"
      description="შექმენით ანგარიში — ნომერზე მიიღებთ დადასტურების კოდს"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <AuthError message={authError} />

        <FormField
          id="full-name"
          label="სახელი და გვარი"
          error={errors.fullName}
        >
          <Input
            id="full-name"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="h-11 bg-card"
            autoFocus
          />
        </FormField>

        <FormField id="phone" label="ტელეფონის ნომერი" error={errors.phone}>
          <PhoneInput
            id="phone"
            value={phone}
            onChange={setPhone}
            invalid={Boolean(errors.phone)}
          />
        </FormField>

        <FormField
          id="password"
          label="პაროლი"
          error={errors.password}
          hint="მინიმუმ 8 სიმბოლო"
        >
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
          />
        </FormField>

        <FormField
          id="confirm-password"
          label="გაიმეორეთ პაროლი"
          error={errors.confirmPassword}
        >
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            invalid={Boolean(errors.confirmPassword)}
          />
        </FormField>

        <Button type="submit" size="lg" className="h-11" disabled={isLoading}>
          {isLoading ? "იგზავნება კოდი..." : "რეგისტრაცია"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          უკვე გაქვთ ანგარიში?{" "}
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
        title="ნომრის დადასტურება"
        onVerify={handleVerify}
        onResend={() => startRegistration(phone)}
      />
    </AuthCard>
  );
}
