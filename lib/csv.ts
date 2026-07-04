export const TRANSACTION_CSV_HEADERS = [
  "doc_key",
  "entry_date",
  "amount",
  "currency",
  "sender_name",
  "sender_inn",
  "sender_account",
  "purpose",
] as const;

export const TRANSACTION_CSV_TEMPLATE = [
  TRANSACTION_CSV_HEADERS.join(","),
  'BOG-2026-07-001,2026-07-03,1500.00,GEL,შპს გეოტრანსი,404871234,GE29BG0000000524671893,"მომსახურების საფასური, ივლისი 2026"',
].join("\n");

function detectDelimiter(headerLine: string): string {
  return headerLine.includes(";") && !headerLine.includes(",") ? ";" : ",";
}

function parseLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values.map((value) => value.trim());
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseLine(lines[0], delimiter).map((header) =>
    header.toLowerCase(),
  );

  return lines.slice(1).map((line) => {
    const values = parseLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

export function downloadCsvTemplate() {
  const blob = new Blob(["﻿" + TRANSACTION_CSV_TEMPLATE], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bog-transactions-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
