"use client";

import { useEffect, useState } from "react";
import { formatPhoneDisplay } from "@/lib/auth/phone";
import { otpCodeSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { OtpInput } from "@/components/auth/otp-input";

const RESEND_COOLDOWN_SECONDS = 60;

type OtpVerifyStepProps = {
  phone: string;
  title: string;
  submitLabel?: string;
  onVerify: (code: string) => Promise<{ error: string | null }>;
  onResend: () => Promise<{ error: string | null }>;
  onBack: () => void;
  children?: React.ReactNode;
};

export function OtpVerifyStep({
  phone,
  title,
  submitLabel = "დადასტურება",
  onVerify,
  onResend,
  onBack,
  children,
}: OtpVerifyStepProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = otpCodeSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setIsLoading(true);

    const { error: verifyError } = await onVerify(parsed.data);
    if (verifyError) {
      setError(verifyError);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    const { error: resendError } = await onResend();
    if (resendError) {
      setError(resendError);
      return;
    }
    setCode("");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <AuthCard
      title={title}
      description={`SMS კოდი გაიგზავნა ნომერზე +995 ${formatPhoneDisplay(phone)}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <AuthError message={error} />

        <OtpInput value={code} onChange={setCode} invalid={Boolean(error)} />

        {children}

        <Button
          type="submit"
          size="lg"
          className="h-11"
          disabled={isLoading || code.length < 6}
        >
          {isLoading ? "მოწმდება..." : submitLabel}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onBack}
            className="font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            ნომრის შეცვლა
          </button>
          {cooldown > 0 ? (
            <span className="text-muted-foreground">
              ხელახლა გაგზავნა {cooldown} წმ-ში
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              კოდის ხელახლა გაგზავნა
            </button>
          )}
        </div>
      </form>
    </AuthCard>
  );
}
