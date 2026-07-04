import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentRecord } from "@/lib/types";

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export async function getDocuments(
  supabase: SupabaseClient,
): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`დოკუმენტების წაკითხვა ვერ მოხერხდა: ${error.message}`);
  }
  return (data ?? []) as DocumentRecord[];
}

export async function uploadDocument(
  supabase: SupabaseClient,
  file: File,
): Promise<void> {
  if (file.type !== "application/pdf") {
    throw new Error(`${file.name}: მხოლოდ PDF ფაილებია დაშვებული`);
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(`${file.name}: ფაილი 10 MB-ზე დიდია`);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("სესია ვერ მოიძებნა — შედით თავიდან");
  }

  const storagePath = `${userData.user.id}/${crypto.randomUUID()}.pdf`;

  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, { contentType: "application/pdf" });

  if (storageError) {
    throw new Error(`${file.name}: ატვირთვა ვერ მოხერხდა`);
  }

  const { error: insertError } = await supabase.from("documents").insert({
    user_id: userData.user.id,
    name: file.name,
    storage_path: storagePath,
    size_bytes: file.size,
  });

  if (insertError) {
    await supabase.storage.from("documents").remove([storagePath]);
    throw new Error(`${file.name}: შენახვა ვერ მოხერხდა`);
  }
}

export async function deleteDocument(
  supabase: SupabaseClient,
  document: DocumentRecord,
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([document.storage_path]);

  if (storageError) {
    throw new Error("ფაილის წაშლა ვერ მოხერხდა");
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", document.id);

  if (error) {
    throw new Error("დოკუმენტის წაშლა ვერ მოხერხდა");
  }
}

export async function getDocumentDownloadUrl(
  supabase: SupabaseClient,
  document: DocumentRecord,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.storage_path, 60);

  if (error || !data) {
    throw new Error("ჩამოტვირთვის ბმული ვერ შეიქმნა");
  }
  return data.signedUrl;
}

export async function analyzeDocument(documentId: string): Promise<void> {
  const response = await fetch("/api/documents/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "ანალიზი ვერ შესრულდა");
  }
}
