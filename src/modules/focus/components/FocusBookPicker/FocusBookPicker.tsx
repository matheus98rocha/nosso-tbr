"use client";

import { BookOpen } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import type { FocusBookPickerProps } from "../../types/focus.components.types";

export default function FocusBookPicker({
  books,
  selectedBookId,
  disabled = false,
  isLoading = false,
  isError = false,
  onSelect,
}: FocusBookPickerProps) {
  if (isLoading) {
    return <Skeleton className="h-9 w-full rounded-md" aria-busy="true" />;
  }

  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Não foi possível carregar seus livros em leitura. Você pode usar o foco
        livre.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="focus-book"
        className="text-sm font-medium leading-none peer-disabled:opacity-50"
      >
        Livro da sessão
      </label>
      <Select
        value={selectedBookId ?? "free"}
        disabled={disabled}
        onValueChange={(value) => onSelect(value === "free" ? null : value)}
      >
        <SelectTrigger id="focus-book" className="w-full">
          <SelectValue placeholder="Selecione um livro" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="free">
            <span className="flex items-center gap-2">
              <BookOpen aria-hidden />
              Modo livre (sem livro vinculado)
            </span>
          </SelectItem>
          {books.map((book) => (
            <SelectItem key={book.id} value={book.id}>
              {book.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Sem livro vinculado, a sessão ainda registra tempo e páginas lidas.
      </p>
    </div>
  );
}
