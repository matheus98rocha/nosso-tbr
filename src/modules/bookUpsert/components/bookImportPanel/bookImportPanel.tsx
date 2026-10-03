"use client";

import { ClipboardCopy, FileUp, Library, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import useCopyBookImportPrompt from "../../hooks/useCopyBookImportPrompt";
import BookUpsertSection from "../bookUpsertSection";
import type {
  BookImportPanelProps,
  BookImportRejectedReason,
  BookImportResultViewProps,
} from "./bookImportPanel.types";

const rejectedReasonCopy: Record<BookImportRejectedReason, string> = {
  duplicate: "O livro não foi criado porque já está na sua biblioteca.",
  invalid: "O livro não foi criado porque os dados ou as colunas são inválidos.",
};

function countLabel(count: number, singular: string, plural: string): string {
  const amount = count.toLocaleString("pt-BR");
  return `${amount} ${count === 1 ? singular : plural}`;
}

function BookImportResultView({ result }: BookImportResultViewProps) {
  if (result.kind === "refused") {
    return (
      <p
        role="status"
        className={cn(
          "rounded-2xl border px-4 py-3 text-sm leading-relaxed",
          "border-zinc-200/80 bg-white/70 text-zinc-700",
          "dark:border-zinc-700/70 dark:bg-zinc-950/30 dark:text-zinc-200",
        )}
      >
        {result.message}
      </p>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "grid gap-3 rounded-2xl border px-4 py-3",
        "border-zinc-200/80 bg-white/70",
        "dark:border-zinc-700/70 dark:bg-zinc-950/30",
      )}
    >
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
        {countLabel(result.createdCount, "livro criado", "livros criados")}
        {" · "}
        {countLabel(
          result.rejectedCount,
          "livro não entrou",
          "livros não entraram",
        )}
      </p>
      {result.rejectedRows.length > 0 ? (
        <ul className="grid max-h-48 gap-2 overflow-y-auto">
          {result.rejectedRows.map((row, index) => (
            <li
              key={`${row.title ?? "sem-titulo"}-${row.reason}-${index}`}
              className={cn(
                "rounded-xl border px-3 py-2",
                "border-zinc-200/80 bg-white/80",
                "dark:border-zinc-700/70 dark:bg-zinc-900/40",
              )}
            >
              {row.title ? (
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {row.title}
                </p>
              ) : null}
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {rejectedReasonCopy[row.reason]}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function BookImportPanel({
  fileName,
  fileSizeLabel,
  isDragging,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileInputChange,
  onRemoveFile,
  result,
}: BookImportPanelProps) {
  const { copied, copyPrompt } = useCopyBookImportPrompt();

  return (
    <div className="grid gap-4">
      <BookUpsertSection
        title="Biblioteca"
        description="Dá para trazer a biblioteca de uma vez."
        icon={<Library className="size-4" />}
      >
        <div className="grid gap-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <p>
            Aceita .csv e .txt no modelo do Nosso TBR ou no export do
            Goodreads. Vírgula ou ponto e vírgula.
          </p>
          <p>Até 5000 livros. A linha de exemplo do modelo não entra.</p>
        </div>

        <label
          htmlFor="book-import-csv"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-6 text-center",
            "border-zinc-300/90 bg-white/70",
            "dark:border-zinc-600 dark:bg-zinc-950/30",
            isDragging &&
              "border-zinc-900 bg-zinc-100/80 dark:border-zinc-100 dark:bg-zinc-800/50",
          )}
        >
          <FileUp className="size-4 text-zinc-500" aria-hidden />
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            Escolher arquivo .csv ou .txt
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Clique ou solte o arquivo aqui
          </span>
          <input
            id="book-import-csv"
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="sr-only"
            onChange={onFileInputChange}
          />
        </label>

        {fileName ? (
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5",
              "border-zinc-200/90 bg-white/70",
              "dark:border-zinc-700/80 dark:bg-zinc-950/30",
            )}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {fileName}
              </p>
              {fileSizeLabel ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {fileSizeLabel}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Remover arquivo"
              onClick={onRemoveFile}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/modelo-importacao-livros.csv"
            download
            className="w-fit px-1 text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300"
          >
            Baixar modelo
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyPrompt()}
          >
            <ClipboardCopy className="size-4" aria-hidden />
            {copied ? "Prompt copiado" : "Copiar prompt para IA"}
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Cole no Gemini ou em outra IA. No texto, escreva o nome de cada livro
          e diga se quer as imagens das capas.
        </p>
      </BookUpsertSection>

      {result ? <BookImportResultView result={result} /> : null}
    </div>
  );
}

export default BookImportPanel;
