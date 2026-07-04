import { Label } from "@/components/ui/label";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
};

export function FormField({
  id,
  label,
  error,
  hint,
  children,
  trailing,
}: FormFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[13px] font-medium">
          {label}
        </Label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p className="text-[13px] leading-snug text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
