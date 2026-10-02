import { stripLatinDiacritics } from "@/utils/stripLatinDiacritics";

import {
  BOOK_IMPORT_LIMIT,
  BOOK_IMPORT_STORYGRAPH_MESSAGE,
  BOOK_IMPORT_TOO_MANY_ROWS_MESSAGE,
  BOOK_IMPORT_UNRECOGNIZED_MESSAGE,
} from "./bookImport.messages";
import type {
  BookImportCandidate,
  BookImportRejectedRow,
  BookImportStatus,
  ParsedBookImport,
} from "./bookImport.types";

type HeaderKind = "template" | "goodreads" | "storygraph";

const TEMPLATE_HEADERS = ["titulo", "autor", "paginas", "status", "data_fim"];
const GOODREADS_HEADERS = [
  "title",
  "author",
  "exclusive shelf",
  "number of pages",
];

const EXAMPLE_TITLE = "Exemplo: não importar";
const EXAMPLE_AUTHOR = "Nosso TBR";

function parseCsvRecords(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = false;
        continue;
      }

      field += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\r") continue;

    if (char === "\n") {
      row.push(field);
      records.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  return records;
}

function headerNames(fields: string[]): Set<string> {
  return new Set(fields.map((field) => field.trim().toLowerCase()));
}

function headerKind(fields: string[]): HeaderKind | null {
  const names = headerNames(fields);
  const has = (name: string) => names.has(name);

  if (
    has("read status") &&
    !has("number of pages") &&
    !has("exclusive shelf")
  ) {
    return "storygraph";
  }

  if (TEMPLATE_HEADERS.every((name) => names.has(name))) return "template";

  if (GOODREADS_HEADERS.every((name) => names.has(name))) return "goodreads";

  return null;
}

function firstPhysicalLine(text: string): string {
  const breakAt = text.search(/\r?\n/);
  return breakAt === -1 ? text : text.slice(0, breakAt);
}

function detectFile(text: string):
  | { delimiter: string; kind: HeaderKind }
  | { kind: "unrecognized" } {
  const line = firstPhysicalLine(text);
  const commaKind = headerKind(parseCsvRecords(line, ",")[0] ?? []);
  const semicolonKind = headerKind(parseCsvRecords(line, ";")[0] ?? []);

  if (commaKind === "storygraph" || semicolonKind === "storygraph") {
    return {
      delimiter: semicolonKind === "storygraph" && commaKind !== "storygraph" ? ";" : ",",
      kind: "storygraph",
    };
  }

  if (commaKind === "template") return { delimiter: ",", kind: "template" };
  if (semicolonKind === "template") return { delimiter: ";", kind: "template" };
  if (commaKind === "goodreads") return { delimiter: ",", kind: "goodreads" };
  if (semicolonKind === "goodreads") return { delimiter: ";", kind: "goodreads" };

  return { kind: "unrecognized" };
}

function columnIndex(header: string[], name: string): number {
  return header.findIndex((field) => field.trim().toLowerCase() === name);
}

function cell(row: string[], index: number): string {
  if (index < 0) return "";
  return row[index] ?? "";
}

function isBlankRow(row: string[]): boolean {
  return row.every((field) => field.trim() === "");
}

function parsePages(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.0+)?$/.test(trimmed)) return null;

  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1) return null;

  return value;
}

function parseImportDate(raw: string): string | null {
  const match = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(raw.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function identityKey(title: string, author: string): string {
  const fold = (value: string) =>
    stripLatinDiacritics(value.trim().toLowerCase());

  return `${fold(title)}\0${fold(author)}`;
}

function isExampleRow(row: {
  title: string;
  author: string;
  pages: string;
  status: string;
  endDate: string;
}): boolean {
  return (
    row.title.trim() === EXAMPLE_TITLE &&
    row.author.trim() === EXAMPLE_AUTHOR &&
    row.pages.trim() === "1" &&
    row.status.trim().toLowerCase() === "not_started" &&
    row.endDate.trim() === ""
  );
}

function templateStatus(raw: string): BookImportStatus | null {
  const status = raw.trim().toLowerCase();
  if (status === "not_started" || status === "reading" || status === "finished") {
    return status;
  }

  return null;
}

function goodreadsStatus(raw: string): BookImportStatus | null {
  const shelf = raw.trim().toLowerCase();
  if (shelf === "to-read") return "not_started";
  if (shelf === "currently-reading") return "reading";
  if (shelf === "read") return "finished";
  return null;
}

function reject(
  rejectedRows: BookImportRejectedRow[],
  title: string,
): void {
  const trimmed = title.trim();
  rejectedRows.push({
    title: trimmed.length > 0 ? trimmed : null,
    reason: "invalid",
  });
}

export function parseBookImportCsv(raw: string): ParsedBookImport {
  const text = raw.replace(/^\uFEFF/, "");
  const detected = detectFile(text);

  if (detected.kind === "unrecognized") {
    return { kind: "refused", message: BOOK_IMPORT_UNRECOGNIZED_MESSAGE };
  }

  if (detected.kind === "storygraph") {
    return { kind: "refused", message: BOOK_IMPORT_STORYGRAPH_MESSAGE };
  }

  const records = parseCsvRecords(text, detected.delimiter);
  const header = records[0] ?? [];
  const titleIndex = columnIndex(
    header,
    detected.kind === "template" ? "titulo" : "title",
  );
  const authorIndex = columnIndex(
    header,
    detected.kind === "template" ? "autor" : "author",
  );
  const pagesIndex = columnIndex(
    header,
    detected.kind === "template" ? "paginas" : "number of pages",
  );
  const statusIndex = columnIndex(
    header,
    detected.kind === "template" ? "status" : "exclusive shelf",
  );
  const dateIndex = columnIndex(
    header,
    detected.kind === "template" ? "data_fim" : "date read",
  );

  const dataRows = records.slice(1).filter((row) => !isBlankRow(row));
  const countable = dataRows.filter((row) => {
    if (detected.kind !== "template") return true;

    return !isExampleRow({
      title: cell(row, titleIndex),
      author: cell(row, authorIndex),
      pages: cell(row, pagesIndex),
      status: cell(row, statusIndex),
      endDate: cell(row, dateIndex),
    });
  });

  if (countable.length > BOOK_IMPORT_LIMIT) {
    return { kind: "refused", message: BOOK_IMPORT_TOO_MANY_ROWS_MESSAGE };
  }

  const candidates: BookImportCandidate[] = [];
  const rejectedRows: BookImportRejectedRow[] = [];
  const seen = new Set<string>();

  for (const row of dataRows) {
    const title = cell(row, titleIndex);
    const author = cell(row, authorIndex);
    const pagesRaw = cell(row, pagesIndex);
    const statusRaw = cell(row, statusIndex);
    const dateRaw = cell(row, dateIndex);

    if (
      detected.kind === "template" &&
      isExampleRow({
        title,
        author,
        pages: pagesRaw,
        status: statusRaw,
        endDate: dateRaw,
      })
    ) {
      continue;
    }

    const pages = parsePages(pagesRaw);
    const status =
      detected.kind === "template"
        ? templateStatus(statusRaw)
        : goodreadsStatus(statusRaw);
    const endDate = status === "finished" ? parseImportDate(dateRaw) : null;

    if (!title.trim() || !author.trim() || pages === null || status === null) {
      reject(rejectedRows, title);
      continue;
    }

    if (status === "finished" && endDate === null) {
      reject(rejectedRows, title);
      continue;
    }

    const key = identityKey(title, author);
    if (seen.has(key)) {
      rejectedRows.push({ title: title.trim(), reason: "duplicate" });
      continue;
    }

    seen.add(key);
    candidates.push({
      title: title.trim(),
      authorName: author.trim(),
      pages,
      status,
      endDate,
    });
  }

  return { kind: "rows", candidates, rejectedRows };
}
