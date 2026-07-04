"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  changePassword,
  getOwnProfile,
  updateProfile,
  uploadAvatar,
} from "@/lib/services/profile";
import { logActivity } from "@/lib/services/activity";
import type { ProfileInput } from "@/lib/schemas/profile";

const profileKey = ["profile"] as const;

export function useProfile() {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: profileKey,
    queryFn: () => getOwnProfile(supabase),
  });
}

export function useUpdateProfile() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: ProfileInput) => {
      await updateProfile(supabase, {
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: input.birthDate ?? null,
      });
      await logActivity(supabase, "profile_updated", "განაახლა პროფილი");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKey });
      router.refresh();
    },
  });
}

export function useUploadAvatar() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadAvatar(supabase, file);
      await logActivity(supabase, "profile_updated", "შეცვალა ავატარი");
      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKey });
      router.refresh();
    },
  });
}

export function useChangePassword() {
  const supabase = useMemo(() => createClient(), []);

  return useMutation({
    mutationFn: async (newPassword: string) => {
      await changePassword(supabase, newPassword);
      await logActivity(supabase, "password_changed", "შეცვალა პაროლი");
    },
  });
}
