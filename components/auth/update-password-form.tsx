"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fieldErrors, updatePasswordSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    const parsed = updatePasswordSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      setAuthError("პაროლის განახლება ვერ მოხერხდა — სცადეთ თავიდან");
      setIsLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <AuthCard
      title="ახალი პაროლი"
      description="შეიყვანეთ ახალი პაროლი ანგარიშისთვის"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <AuthError message={authError} />

        <FormField
          id="password"
          label="ახალი პაროლი"
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
          {isLoading ? "ინახება..." : "პაროლის შენახვა"}
        </Button>
      </form>
    </AuthCard>
  );
}
