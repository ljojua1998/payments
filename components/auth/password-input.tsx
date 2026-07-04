"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  invalid?: boolean;
};

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  invalid,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={cn(
        "flex h-11 w-full items-stretch overflow-hidden rounded-md border border-input bg-card shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        invalid && "border-destructive focus-within:ring-destructive",
      )}
    >
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground/60 md:text-sm"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "პაროლის დამალვა" : "პაროლის ჩვენება"}
        className="flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
