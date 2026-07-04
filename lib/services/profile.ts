import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

export async function getOwnProfile(
  supabase: SupabaseClient,
): Promise<Profile> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("სესია ვერ მოიძებნა — შედით თავიდან");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (error) {
    throw new Error(`პროფილის წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }
  return data as Profile;
}

export async function updateProfile(
  supabase: SupabaseClient,
  input: { firstName: string; lastName: string; birthDate: string | null },
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("სესია ვერ მოიძებნა");

  const fullName = `${input.firstName} ${input.lastName}`.trim();

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      full_name: fullName,
      birth_date: input.birthDate,
    })
    .eq("id", userData.user.id);

  if (error) {
    throw new Error(`პროფილის განახლება ვერ მოხერხდა: ${error.message}`);
  }

  await supabase.auth.updateUser({ data: { full_name: fullName } });
}

export async function uploadAvatar(
  supabase: SupabaseClient,
  file: File,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("აირჩიეთ სურათი (JPG, PNG, WebP)");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("სურათი 2 MB-ზე დიდია");
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("სესია ვერ მოიძებნა");

  const path = `${userData.user.id}/avatar`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    throw new Error("სურათის ატვირთვა ვერ მოხერხდა");
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userData.user.id);

  if (error) {
    throw new Error("ავატარის შენახვა ვერ მოხერხდა");
  }
  return avatarUrl;
}

export async function changePassword(
  supabase: SupabaseClient,
  newPassword: string,
): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(
      error.message.includes("different from the old")
        ? "ახალი პაროლი ძველის იდენტურია"
        : "პაროლის შეცვლა ვერ მოხერხდა — სცადეთ თავიდან",
    );
  }
}
