import { NextResponse } from "next/server";

import { requireUser } from "@/app/api/_utils/requireUser";
import { createClient } from "@/lib/supabase/server";
import {
  parseBookImportCsv,
  type BookImportRejectedRow,
} from "@/modules/bookUpsert/services/bookImport";

type ImportRpcDuplicate = { title?: string | null };

type ImportRpcResult = {
  createdCount?: number;
  duplicates?: ImportRpcDuplicate[];
  invalid?: ImportRpcDuplicate[];
};

function refused(message: string, status = 200) {
  return NextResponse.json({ kind: "refused", message }, { status });
}

function rowTitle(title: string | null | undefined): string | null {
  const trimmed = title?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return refused("Escolha um arquivo .csv.", 400);
  }

  const file = form.get("file");
  if (typeof file === "string" || !file || typeof file.text !== "function") {
    return refused("Escolha um arquivo .csv.", 400);
  }

  const parsed = parseBookImportCsv(await file.text());
  if (parsed.kind === "refused") {
    return NextResponse.json(parsed);
  }

  const rejectedRows: BookImportRejectedRow[] = [...parsed.rejectedRows];

  if (parsed.candidates.length === 0) {
    return NextResponse.json({
      kind: "report",
      createdCount: 0,
      rejectedCount: rejectedRows.length,
      rejectedRows,
    });
  }

  const { data, error } = await supabase.rpc("import_reader_books", {
    p_rows: parsed.candidates.map((candidate) => ({
      title: candidate.title,
      author_name: candidate.authorName,
      pages: candidate.pages,
      status: candidate.status,
      end_date: candidate.endDate,
    })),
  });

  if (error) {
    return refused("Não foi possível importar agora.", 500);
  }

  const result = (data ?? {}) as ImportRpcResult;
  for (const duplicate of result.duplicates ?? []) {
    rejectedRows.push({
      title: rowTitle(duplicate.title),
      reason: "duplicate",
    });
  }
  for (const invalid of result.invalid ?? []) {
    rejectedRows.push({
      title: rowTitle(invalid.title),
      reason: "invalid",
    });
  }

  const createdCount = result.createdCount ?? 0;

  return NextResponse.json({
    kind: "report",
    createdCount,
    rejectedCount: rejectedRows.length,
    rejectedRows,
  });
}
