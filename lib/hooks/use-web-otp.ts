"use client";

import { useEffect } from "react";

type OtpCredential = Credential & { code: string };

type OtpCredentialRequestOptions = CredentialRequestOptions & {
  otp: { transport: string[] };
};

export function useWebOtp(active: boolean, onCode: (code: string) => void) {
  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined" || !("OTPCredential" in window)) return;

    const controller = new AbortController();
    const options: OtpCredentialRequestOptions = {
      otp: { transport: ["sms"] },
      signal: controller.signal,
    };

    navigator.credentials
      .get(options)
      .then((credential) => {
        const code = (credential as OtpCredential | null)?.code;
        if (code) onCode(code);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [active, onCode]);
}
