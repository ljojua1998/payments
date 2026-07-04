import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

async function UserMenu() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  const fullName =
    (data.claims.user_metadata?.full_name as string | undefined) ??
    "მომხმარებელი";

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground md:inline">
        {fullName}
      </span>
      <ThemeSwitcher />
      <LogoutButton />
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <span className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
              ₾
            </span>
            <span className="font-display text-lg font-semibold">ბალანსი</span>
          </span>
          <Suspense
            fallback={<div className="h-9 w-24 animate-pulse rounded-md bg-muted" />}
          >
            <UserMenu />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">
          დეშბორდი მზადდება
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          აქ გამოჩნდება გადახდების შედარების დეშბორდი — ტრანზაქციები,
          სტატისტიკა და მოსალოდნელი vs ფაქტობრივი შეჯამება.
        </p>
      </main>
    </div>
  );
}
