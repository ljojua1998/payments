"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toE164 } from "@/lib/auth/phone";
import { fieldErrors, loginSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PhoneInput } from "@/components/auth/phone-input";
import { PasswordInput } from "@/components/auth/password-input";

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    const parsed = loginSchema.safeParse({ phone, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      phone: toE164(parsed.data.phone),
      password: parsed.data.password,
    });

    if (error) {
      setAuthError(
        error.message === "Invalid login credentials"
          ? "ნომერი ან პაროლი არასწორია"
          : "შესვლა ვერ მოხერხდა — სცადეთ თავიდან",
      );
      setIsLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <AuthCard
      title="შესვლა"
      description="შედით ანგარიშზე ტელეფონის ნომრით და პაროლით"
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

        <FormField
          id="password"
          label="პაროლი"
          error={errors.password}
          trailing={
            <Link
              href="/auth/forgot-password"
              className="text-[13px] font-medium text-primary underline-offset-4 hover:underline"
            >
              დაგავიწყდათ პაროლი?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            invalid={Boolean(errors.password)}
          />
        </FormField>

        <Button type="submit" size="lg" className="h-11" disabled={isLoading}>
          {isLoading ? "მოწმდება..." : "შესვლა"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          არ გაქვთ ანგარიში?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            რეგისტრაცია
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
