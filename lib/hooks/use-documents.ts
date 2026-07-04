"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  analyzeDocument,
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "@/lib/services/documents";
import type { DocumentRecord } from "@/lib/types";

const documentsKey = ["documents"] as const;

export function useDocuments() {
  const supabase = useMemo(() => createClient(), []);
  return useQuery({
    queryKey: documentsKey,
    queryFn: () => getDocuments(supabase),
  });
}

export function useUploadDocuments() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const failures: string[] = [];
      for (const file of files) {
        try {
          await uploadDocument(supabase, file);
        } catch (error) {
          failures.push(
            error instanceof Error ? error.message : "ატვირთვის შეცდომა",
          );
        }
      }
      if (failures.length > 0) {
        throw new Error(failures.join("; "));
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

export function useDeleteDocument() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (document: DocumentRecord) =>
      deleteDocument(supabase, document),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

export function useAnalyzeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (document: DocumentRecord) => analyzeDocument(document.id),
    onMutate: (document) => {
      queryClient.setQueryData<DocumentRecord[]>(documentsKey, (rows) =>
        rows?.map((row) =>
          row.id === document.id ? { ...row, status: "analyzing" } : row,
        ),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}
