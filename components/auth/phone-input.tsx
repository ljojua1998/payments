"use client";

import { cn } from "@/lib/utils";
import { formatPhoneDisplay, stripPhoneInput } from "@/lib/auth/phone";

type PhoneInputProps = {
  id: string;
  value: string;
  onChange: (digits: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
};

export function PhoneInput({
  id,
  value,
  onChange,
  invalid,
  autoFocus,
}: PhoneInputProps) {
  return (
    <div
      className={cn(
        "flex h-11 w-full items-stretch overflow-hidden rounded-md border border-input bg-card shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        invalid && "border-destructive focus-within:ring-destructive",
      )}
    >
      <span className="flex select-none items-center border-r border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
        +995
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="5XX XX XX XX"
        autoFocus={autoFocus}
        value={formatPhoneDisplay(value)}
        onChange={(event) => onChange(stripPhoneInput(event.target.value))}
        className="w-full bg-transparent px-3 text-base tracking-wide outline-none placeholder:text-muted-foreground/60 md:text-sm"
      />
    </div>
  );
}
