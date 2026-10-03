"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import type {
  BookEntryMode,
  UseBookImportEntryParams,
} from "../components/bookImportPanel/bookImportPanel.types";

function isImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || name.endsWith(".txt");
}

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB"] as const;
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const digits = unitIndex === 0 ? 0 : 1;

  return `${size.toLocaleString("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })} ${units[unitIndex]}`;
}

export default function useBookImportEntry({
  isOpen,
  onImportBooks,
}: UseBookImportEntryParams) {
  const [mode, setModeState] = useState<BookEntryMode>("single");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) return;

    setModeState("single");
    setFile(null);
    setIsDragging(false);
  }, [isOpen]);

  const setMode = useCallback((next: BookEntryMode) => {
    setModeState(next);
  }, []);

  const fileSummary = useMemo(() => {
    if (!file) return null;

    return {
      name: file.name,
      sizeLabel: formatFileSize(file.size),
    };
  }, [file]);

  const removeFile = useCallback(() => {
    setFile(null);
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const next = event.dataTransfer.files.item(0);

    if (!next || !isImportFile(next)) return;

    setFile(next);
  }, []);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.files?.item(0) ?? null;

      if (next && isImportFile(next)) {
        setFile(next);
      }

      event.target.value = "";
    },
    [],
  );

  const handleImport = useCallback(() => {
    if (!file) return;

    onImportBooks?.(file);
  }, [file, onImportBooks]);

  return useMemo(
    () => ({
      canImport: file !== null,
      file,
      fileSummary,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleImport,
      handleInputChange,
      isBulk: mode === "bulk",
      isDragging,
      mode,
      removeFile,
      setMode,
    }),
    [
      file,
      fileSummary,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleImport,
      handleInputChange,
      isDragging,
      mode,
      removeFile,
      setMode,
    ],
  );
}
