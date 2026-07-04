import Link from "next/link";
import { BrandMark, BrandPanel } from "@/components/auth/brand-panel";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <BrandPanel />
      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-border px-5 py-4 lg:hidden">
          <Link href="/auth/login">
            <BrandMark compact />
          </Link>
          <span className="text-xs text-muted-foreground">
            გადახდების შედარება
          </span>
        </header>
        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[26rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
