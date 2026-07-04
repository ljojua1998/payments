import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityRecord } from "@/lib/types";

const ACTIVITY_FETCH_LIMIT = 200;

export async function logActivity(
  supabase: SupabaseClient,
  action: string,
  details: string,
): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const metadata = user.user_metadata as { full_name?: string };
    await supabase.from("activity_log").insert({
      user_id: user.id,
      user_name: metadata.full_name ?? "მომხმარებელი",
      action,
      details,
    });
  } catch {
    return;
  }
}

export async function getActivity(
  supabase: SupabaseClient,
): Promise<ActivityRecord[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(ACTIVITY_FETCH_LIMIT);

  if (error) {
    throw new Error(`ისტორიის წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }
  return (data ?? []) as ActivityRecord[];
}
