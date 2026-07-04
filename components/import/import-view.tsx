"use client";

import { useRef, useState } from "react";
import { CircleCheck, Download, FileSpreadsheet, Upload } from "lucide-react";
import { downloadCsvTemplate, parseCsv } from "@/lib/csv";
import { formatDate, formatGel } from "@/lib/format";
import { transactionRowSchema, type TransactionRowInput } from "@/lib/schemas/data-entry";
import { useImportTransactions } from "@/lib/hooks/use-import";
import type { ImportResult } from "@/lib/services/transactions-import";
import { Button } from "@/components/ui/button";
import { ManualTransactionDialog } from "@/components/import/manual-transaction-dialog";

type ParsedFile = {
  fileName: string;
  valid: TransactionRowInput[];
  invalid: Array<{ line: number; message: string }>;
};

export function ImportView() {
  const importMutation = useImportTransactions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (file: File) => {
    setResult(null);
    const rows = parseCsv(await file.text());
    const valid: TransactionRowInput[] = [];
    const invalid: ParsedFile["invalid"] = [];

    rows.forEach((row, index) => {
      const parsed = transactionRowSchema.safeParse(row);
      if (parsed.success) {
        valid.push(parsed.data);
      } else {
        invalid.push({
          line: index + 2,
          message: parsed.error.issues[0].message,
        });
      }
    });

    setParsedFile({ fileName: file.name, valid, invalid });
  };

  const handleImport = () => {
    if (!parsedFile || parsedFile.valid.length === 0) return;
    importMutation.mutate(parsedFile.valid, {
      onSuccess: (importResult) => {
        setResult(importResult);
        setParsedFile(null);
      },
    });
  };

  const showResult = (importResult: ImportResult) => setResult(importResult);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">იმპორტი</h1>
          <p className="text-sm text-muted-foreground">
            საბანკო ტრანზაქციების დამატება — CSV ამონაწერით ან ხელით
          </p>
        </div>
        <ManualTransactionDialog onImported={showResult} />
      </div>

      {result && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm"
        >
          <span className="inline-flex items-center gap-1.5 font-medium text-success">
            <CircleCheck size={15} />
            იმპორტი დასრულდა
          </span>
          <span>დაემატა: <b className="tabular-nums">{result.inserted}</b></span>
          <span>
            გამოტოვდა (დუბლიკატი):{" "}
            <b className="tabular-nums">{result.skipped}</b>
          </span>
          <span>
            ავტომატურად დაემთხვა:{" "}
            <b className="tabular-nums">{result.matched}</b>
          </span>
        </div>
      )}

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-base font-semibold">CSV ამონაწერი</h2>
            <p className="text-xs text-muted-foreground">
              სვეტები BOG API-ის ფორმატით — დუბლიკატები (doc_key) ავტომატურად გამოიტოვება
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={downloadCsvTemplate}
          >
            <Download size={14} />
            შაბლონი
          </Button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileSpreadsheet size={20} />
            </span>
            <span className="font-medium">აირჩიეთ CSV ფაილი</span>
            <span className="text-sm text-muted-foreground">
              ინტერნეტბანკიდან გადმოწერილი ამონაწერი
            </span>
          </button>

          {parsedFile && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-medium">{parsedFile.fileName}</span>
                <span className="text-success">
                  ვალიდური: <b className="tabular-nums">{parsedFile.valid.length}</b>
                </span>
                {parsedFile.invalid.length > 0 && (
                  <span className="text-destructive">
                    შეცდომით: <b className="tabular-nums">{parsedFile.invalid.length}</b>
                  </span>
                )}
              </div>

              {parsedFile.invalid.length > 0 && (
                <ul className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {parsedFile.invalid.slice(0, 3).map((issue) => (
                    <li key={issue.line}>
                      ხაზი {issue.line}: {issue.message}
                    </li>
                  ))}
                  {parsedFile.invalid.length > 3 && (
                    <li>… და კიდევ {parsedFile.invalid.length - 3}</li>
                  )}
                </ul>
              )}

              {parsedFile.valid.length > 0 && (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2 font-medium">თარიღი</th>
                        <th className="px-3 py-2 font-medium">doc_key</th>
                        <th className="px-3 py-2 font-medium">გამგზავნი</th>
                        <th className="px-3 py-2 text-right font-medium">თანხა</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedFile.valid.slice(0, 5).map((row) => (
                        <tr key={row.doc_key} className="border-b border-border/60 last:border-0">
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                            {formatDate(row.entry_date)}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {row.doc_key}
                          </td>
                          <td className="max-w-[200px] truncate px-3 py-2">
                            {row.sender_name ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                            {formatGel(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedFile.valid.length > 5 && (
                    <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
                      … და კიდევ {parsedFile.valid.length - 5} ჩანაწერი
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending || parsedFile.valid.length === 0}
                  className="gap-2"
                >
                  <Upload size={15} />
                  {importMutation.isPending
                    ? "იმპორტირდება..."
                    : `იმპორტი (${parsedFile.valid.length})`}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setParsedFile(null)}>
                  გაუქმება
                </Button>
              </div>
              {importMutation.isError && (
                <p className="text-sm text-destructive">
                  {importMutation.error.message}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card px-4 py-4 text-sm leading-relaxed text-muted-foreground sm:px-5">
        <h2 className="mb-1 text-base font-semibold text-foreground">
          როგორ მუშაობს
        </h2>
        <p>
          პროდაქშენში ტრანზაქციები საქართველოს ბანკის API-დან ყოველდღიურად,
          ავტომატურად შემოვა. ეს გვერდი იმავე ფორმატს იღებს ხელით — CSV
          ამონაწერით ან ცალკეული ჩანაწერით. ყოველი იმპორტის შემდეგ ავტო-მატჩინგი
          ეშვება და ახალი გადახდები ს/კ-ით ებმება კომპანიებს; დუბლიკატებს
          უნიკალური doc_key ფილტრავს.
        </p>
      </section>
    </div>
  );
}
