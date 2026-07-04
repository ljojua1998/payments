"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getActivity } from "@/lib/services/activity";

export function useActivity() {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: ["activity"],
    queryFn: () => getActivity(supabase),
  });
}
