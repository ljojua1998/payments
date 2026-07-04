"use client";

import { useDocuments, useUploadDocuments } from "@/lib/hooks/use-documents";
import { usePagination } from "@/lib/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import { DocumentRow } from "@/components/documents/document-row";

export function DocumentsView() {
  const documentsQuery = useDocuments();
  const pagination = usePagination(documentsQuery.data ?? []);
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
          <>
            <ul className="divide-y divide-border/70">
              {pagination.pageItems.map((document) => (
                <DocumentRow key={document.id} document={document} />
              ))}
            </ul>
            {pagination.total > 10 && (
              <div className="border-t border-border px-4 py-3 sm:px-5">
                <PaginationControls
                  page={pagination.page}
                  pageCount={pagination.pageCount}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
