import { Check, FileText, Landmark, Wand2 } from "lucide-react";
import { PaymentsLogo } from "@/components/logo";

const LEDGER_ROWS = [
  { account: "GE•• BG •••• •• 1893", delay: "0s" },
  { account: "GE•• BG •••• •• 6729", delay: "1.4s" },
  { account: "GE•• BG •••• •• 9365", delay: "2.8s" },
];

const FEATURES = [
  { icon: Landmark, text: "საბანკო ინტეგრაცია" },
  { icon: Wand2, text: "ავტომატური მატჩინგი" },
  { icon: FileText, text: "AI დოკუმენტების ანალიზი" },
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
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 75% 55% at 15% -5%, hsl(224 76% 40% / 0.55), transparent), radial-gradient(ellipse 60% 45% at 100% 105%, hsl(221 85% 62% / 0.18), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 30%, black, transparent)",
        }}
      />

      <div className="relative">
        <BrandMark />
      </div>

      <div className="relative flex flex-col gap-9">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
            გადახდების შედარების სისტემა
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white xl:text-5xl">
            ყველა გადარიცხვა
            <br />
            თავის ადგილზე
          </h1>
          <p className="max-w-md text-base leading-relaxed text-white/65">
            საბანკო ტრანზაქციები ავტომატურად ერგება ხელშეკრულებებს — ერთ ეკრანზე
            ხედავთ ვინ გადაიხადა, ვინ დააკლო და ვინ არა.
          </p>
        </div>

        <div className="flex max-w-md flex-col gap-2.5">
          {LEDGER_ROWS.map((row) => (
            <div
              key={row.account}
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
                <span className="text-sm tabular-nums tracking-wide text-white/80">
                  {row.account}
                </span>
              </div>
              <span className="text-xs font-medium text-white/45">
                გადარიცხვა
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-red-400" />
              </span>
              <span className="text-sm tabular-nums tracking-wide text-white/80">
                GE•• BG •••• •• 0000
              </span>
            </div>
            <span className="rounded-full bg-red-400/15 px-2.5 py-0.5 text-xs font-medium text-red-300">
              შეუსაბამო
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex flex-wrap gap-x-5 gap-y-2">
        {FEATURES.map((feature) => (
          <span
            key={feature.text}
            className="inline-flex items-center gap-2 text-sm text-white/55"
          >
            <feature.icon size={15} className="text-white/40" />
            {feature.text}
          </span>
        ))}
      </div>
    </aside>
  );
}
