"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPhoneDisplay } from "@/lib/auth/phone";
import { otpCodeSchema } from "@/lib/schemas/auth";
import { useWebOtp } from "@/lib/hooks/use-web-otp";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthError } from "@/components/auth/auth-card";
import { OtpInput } from "@/components/auth/otp-input";

const RESEND_COOLDOWN_SECONDS = 60;

type OtpDialogProps = {
  open: boolean;
  onClose: () => void;
  phone: string;
  title: string;
  submitLabel?: string;
  autoSubmit?: boolean;
  onVerify: (code: string) => Promise<{ error: string | null }>;
  onResend: () => Promise<{ error: string | null }>;
  children?: React.ReactNode;
};

export function OtpDialog({
  open,
  onClose,
  phone,
  title,
  submitLabel = "დადასტურება",
  autoSubmit = true,
  onVerify,
  onResend,
  children,
}: OtpDialogProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (open) {
      setCode("");
      setError(null);
      setIsLoading(false);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }, [open]);

  useEffect(() => {
    if (!open || cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, cooldown]);

  const submit = useCallback(
    async (candidate: string) => {
      setError(null);
      const parsed = otpCodeSchema.safeParse(candidate);
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
    },
    [onVerify],
  );

  const handleAutofill = useCallback(
    (filled: string) => {
      const digits = filled.replace(/\D/g, "").slice(0, 6);
      if (!digits) return;
      setCode(digits);
      if (autoSubmit && digits.length === 6) {
        void submit(digits);
      }
    },
    [autoSubmit, submit],
  );

  useWebOtp(open, handleAutofill);

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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            SMS კოდი გაიგზავნა ნომერზე +995 {formatPhoneDisplay(phone)}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit(code);
          }}
          className="flex flex-col gap-5"
          noValidate
        >
          <AuthError message={error} />

          <OtpInput
            value={code}
            onChange={setCode}
            invalid={Boolean(error)}
            autoFocus={open}
          />

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
              onClick={onClose}
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
      </DialogContent>
    </Dialog>
  );
}
