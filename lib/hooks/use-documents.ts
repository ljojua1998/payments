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
import { logActivity } from "@/lib/services/activity";
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
      const uploaded: string[] = [];
      for (const file of files) {
        try {
          await uploadDocument(supabase, file);
          uploaded.push(file.name);
        } catch (error) {
          failures.push(
            error instanceof Error ? error.message : "ატვირთვის შეცდომა",
          );
        }
      }
      if (uploaded.length > 0) {
        await logActivity(
          supabase,
          "document_uploaded",
          `ატვირთა დოკუმენტი: ${uploaded.join(", ")}`,
        );
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
    mutationFn: async (document: DocumentRecord) => {
      await deleteDocument(supabase, document);
      await logActivity(
        supabase,
        "document_deleted",
        `წაშალა დოკუმენტი „${document.name}"`,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

export function useAnalyzeDocument() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: DocumentRecord) => {
      await analyzeDocument(document.id);
      await logActivity(
        supabase,
        "document_analyzed",
        `გააანალიზა დოკუმენტი „${document.name}" AI-თ`,
      );
    },
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
