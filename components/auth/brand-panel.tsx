import { Check } from "lucide-react";
import { PaymentsLogo } from "@/components/logo";

const LEDGER_ROWS = [
  { sender: "შპს გეოტრანსი", amount: "1 500,00 ₾", delay: "0s" },
  { sender: "სს კავკას ექსპრესი", amount: "3 100,00 ₾", delay: "1.4s" },
  { sender: "შპს ეკო ტრანსპორტი", amount: "750,00 ₾", delay: "2.8s" },
];

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <PaymentsLogo size={compact ? 30 : 38} />
      <span
        className={
          compact
            ? "font-display text-lg font-semibold"
            : "font-display text-xl font-semibold text-white"
        }
      >
        Payments
      </span>
    </span>
  );
}

export function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-deep p-10 lg:flex xl:p-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 55% at 20% 0%, hsl(168 62% 25% / 0.5), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, hsl(41 72% 56% / 0.12), transparent)",
        }}
      />

      <div className="relative">
        <BrandMark />
      </div>

      <div className="relative flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            გადახდების შედარების სისტემა
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white xl:text-5xl">
            ყველა გადარიცხვა თავის ადგილზეა
          </h1>
          <p className="max-w-md text-base leading-relaxed text-white/70">
            საბანკო ტრანზაქციები ავტომატურად ემთხვევა ხელშეკრულებებს — ერთ
            ეკრანზე ხედავთ ვინ გადაიხადა, ვინ დააკლო და ვინ საერთოდ არ
            გამოჩენილა.
          </p>
        </div>

        <div className="flex max-w-md flex-col gap-2.5">
          {LEDGER_ROWS.map((row) => (
            <div
              key={row.sender}
              className="ledger-row flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
              style={{ "--delay": row.delay } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <span
                    className="ledger-pending absolute h-2 w-2 rounded-full bg-white/30"
                    style={{ "--delay": row.delay } as React.CSSProperties}
                  />
                  <span
                    className="ledger-check absolute flex h-5 w-5 items-center justify-center rounded-full bg-success text-success-foreground"
                    style={{ "--delay": row.delay } as React.CSSProperties}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                </span>
                <span className="text-sm text-white/85">{row.sender}</span>
              </div>
              <span className="text-sm font-medium tabular-nums text-white/85">
                {row.amount}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-red-400" />
              </span>
              <span className="text-sm text-white/85">უცნობი გამგზავნი</span>
            </div>
            <span className="rounded-full bg-red-400/15 px-2.5 py-0.5 text-xs font-medium text-red-300">
              შეუსაბამო
            </span>
          </div>
        </div>
      </div>

      <p className="relative text-sm text-white/45">
        89 ტრანზაქცია · 15 კომპანია · აპრილი–ივნისი 2026
      </p>
    </aside>
  );
}
