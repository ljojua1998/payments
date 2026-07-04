import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export async function UserMenu({ compact = false }: { compact?: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  const fullName =
    (data.claims.user_metadata?.full_name as string | undefined) ??
    "მომხმარებელი";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {fullName.trim().charAt(0).toUpperCase()}
        </span>
        <span className="truncate text-sm font-medium">{fullName}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeSwitcher />
        <LogoutButton />
      </div>
    </div>
  );
}
