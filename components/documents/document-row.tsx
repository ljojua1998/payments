"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Loader2, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getDocumentDownloadUrl } from "@/lib/services/documents";
import {
  useAnalyzeDocument,
  useDeleteDocument,
} from "@/lib/hooks/use-documents";
import type { DocumentRecord, DocumentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";

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

export function DocumentRow({ document }: { document: DocumentRecord }) {
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
        <p className="mt-2 text-sm text-destructive">{analyze.error.message}</p>
      )}

      {expanded && document.summary && (
        <div className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-background px-4 py-3 text-sm leading-relaxed">
          {document.summary}
        </div>
      )}
    </li>
  );
}
