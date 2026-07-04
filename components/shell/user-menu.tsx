import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

function Avatar({
  name,
  avatarUrl,
  size,
}: {
  name: string;
  avatarUrl: string | null;
  size: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
      style={{ width: size, height: size }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export async function UserMenu({ compact = false }: { compact?: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", data.claims.sub)
    .maybeSingle();

  const fullName =
    profile?.full_name ??
    (data.claims.user_metadata?.full_name as string | undefined) ??
    "მომხმარებელი";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/settings" aria-label="პარამეტრები">
          <Avatar name={fullName} avatarUrl={profile?.avatar_url ?? null} size={30} />
        </Link>
        <ThemeSwitcher />
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5">
      <Link
        href="/settings"
        className="flex min-w-0 items-center gap-2.5 rounded-md transition-opacity hover:opacity-80"
        aria-label="პარამეტრები"
      >
        <Avatar name={fullName} avatarUrl={profile?.avatar_url ?? null} size={32} />
        <span className="truncate text-sm font-medium">{fullName}</span>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href="/settings"
          aria-label="პარამეტრები"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings size={16} />
        </Link>
        <ThemeSwitcher />
        <LogoutButton />
      </div>
    </div>
  );
}
