import { Suspense } from "react";
import Link from "next/link";
import { PaymentsLogo } from "@/components/logo";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { BottomNav, SidebarNav } from "@/components/shell/nav-links";
import { UserMenu } from "@/components/shell/user-menu";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh flex-col border-r border-border bg-card px-4 py-5 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <PaymentsLogo size={32} />
          <span className="text-lg font-semibold tracking-tight">
            Payments
          </span>
        </Link>
        <div className="mt-8 flex-1">
          <SidebarNav />
        </div>
        <Suspense
          fallback={<div className="h-14 animate-pulse rounded-lg bg-muted" />}
        >
          <UserMenu />
        </Suspense>
      </aside>

      <div className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <PaymentsLogo size={28} />
            <span className="font-semibold tracking-tight">Payments</span>
          </Link>
          <Suspense fallback={<div className="h-8 w-20 animate-pulse rounded-md bg-muted" />}>
            <UserMenu compact />
          </Suspense>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-7 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
      <AssistantWidget />
    </div>
  );
}
