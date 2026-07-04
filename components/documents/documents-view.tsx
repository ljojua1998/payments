"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getDocumentDownloadUrl } from "@/lib/services/documents";
import {
  useAnalyzeDocument,
  useDeleteDocument,
  useDocuments,
  useUploadDocuments,
} from "@/lib/hooks/use-documents";
import type { DocumentRecord, DocumentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/documents/upload-dropzone";

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  uploaded: {
    label: "ატვირთული",
    className: "bg-secondary text-secondary-foreground border-border",
  },
  analyzing: {
    label: "ანალიზდება",
    className: "bg-warning/10 text-warning border-warning/25",
  },
  analyzed: {
    label: "გაანალიზებული",
    className: "bg-success/10 text-success border-success/25",
  },
  error: {
    label: "შეცდომა",
    className: "bg-destructive/10 text-destructive border-destructive/25",
  },
};

const dateFormatter = new Intl.DateTimeFormat("ka-GE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function DocumentRow({ document }: { document: DocumentRecord }) {
  const supabase = useMemo(() => createClient(), []);
  const analyze = useAnalyzeDocument();
  const remove = useDeleteDocument();
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[document.status];
  const isAnalyzing = document.status === "analyzing" || analyze.isPending;

  const handleDownload = async () => {
    const url = await getDocumentDownloadUrl(supabase, document);
    window.open(url, "_blank", "noopener");
  };

  const handleDelete = () => {
    if (window.confirm(`წაიშალოს „${document.name}"?`)) {
      remove.mutate(document);
    }
  };

  return (
    <li className="px-4 py-3.5 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText size={17} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium" title={document.name}>
              {document.name}
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
              {formatSize(document.size_bytes)} ·{" "}
              {dateFormatter.format(new Date(document.created_at))}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
            status.className,
          )}
        >
          {isAnalyzing && <Loader2 size={11} className="animate-spin" />}
          {isAnalyzing ? "ანალიზდება" : status.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={document.status === "analyzed" ? "outline" : "default"}
          className="gap-1.5"
          disabled={isAnalyzing}
          onClick={() => analyze.mutate(document)}
        >
          <Sparkles size={14} />
          {document.status === "analyzed"
            ? "თავიდან გაანალიზება"
            : "AI ანალიზი"}
        </Button>
        {document.summary && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "შეჯამების დამალვა" : "შეჯამების ნახვა"}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label="ჩამოტვირთვა"
            onClick={handleDownload}
          >
            <Download size={15} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label="წაშლა"
            disabled={remove.isPending}
            onClick={handleDelete}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {analyze.isError && (
        <p className="mt-2 text-sm text-destructive">
          {analyze.error.message}
        </p>
      )}

      {expanded && document.summary && (
        <div className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-background px-4 py-3 text-sm leading-relaxed">
          {document.summary}
        </div>
      )}
    </li>
  );
}

export function DocumentsView() {
  const documentsQuery = useDocuments();
  const upload = useUploadDocuments();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">დოკუმენტები</h1>
        <p className="text-sm text-muted-foreground">
          ატვირთეთ PDF დოკუმენტები — AI გააანალიზებს და შეაჯამებს
        </p>
      </div>

      <UploadDropzone
        onFiles={(files) => upload.mutate(files)}
        isUploading={upload.isPending}
      />

      {upload.isError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {upload.error.message}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3.5 sm:px-5">
          <h2 className="text-base font-semibold">
            ატვირთული ფაილები
            {documentsQuery.data && (
              <span className="ml-2 text-sm font-normal tabular-nums text-muted-foreground">
                {documentsQuery.data.length}
              </span>
            )}
          </h2>
        </div>

        {documentsQuery.isPending ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : documentsQuery.isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">
              {documentsQuery.error.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => documentsQuery.refetch()}
            >
              თავიდან ცდა
            </Button>
          </div>
        ) : documentsQuery.data.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            ჯერ არაფერია ატვირთული — დაიწყეთ ზემოთ, პირველი PDF-ით
          </p>
        ) : (
          <ul className="divide-y divide-border/70">
            {documentsQuery.data.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
