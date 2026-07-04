"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
};

export function OtpInput({
  value,
  onChange,
  invalid,
  autoFocus,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputsRef.current[0]?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const focusCell = (index: number) => {
    inputsRef.current[Math.min(Math.max(index, 0), CODE_LENGTH - 1)]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    const next = (value.slice(0, index) + digits).slice(0, CODE_LENGTH);
    onChange(next);
    focusCell(next.length);
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else {
        onChange(value.slice(0, -1));
      }
      focusCell(index - 1);
    }
    if (event.key === "ArrowLeft") focusCell(index - 1);
    if (event.key === "ArrowRight") focusCell(index + 1);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!digits) return;
    onChange(digits);
    focusCell(digits.length);
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {Array.from({ length: CODE_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          aria-label={`კოდის ${index + 1} ციფრი`}
          value={value[index] ?? ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          className={cn(
            "h-12 w-full max-w-12 rounded-md border border-input bg-card text-center text-lg font-semibold shadow-sm outline-none transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-1",
            invalid && "border-destructive focus:ring-destructive",
          )}
        />
      ))}
    </div>
  );
}
