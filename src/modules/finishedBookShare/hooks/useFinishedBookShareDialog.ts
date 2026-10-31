"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { FINISHED_BOOK_SHARE_COPY } from "../constants";
import type { FinishedBookShareSubject } from "../types";
import { buildShareModel } from "../utils/buildShareModel";
import {
  renderFinishedBookCardPng,
  triggerFinishedBookShareDownload,
} from "../utils/renderFinishedBookCardPng";

export function useFinishedBookShareDialog(subject: FinishedBookShareSubject) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const blobRef = useRef<Blob | null>(null);

  const model = useMemo(() => buildShareModel(subject), [subject]);
  const actionsDisabled = useMemo(() => phase !== "ready", [phase]);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    blobRef.current = null;
    setPhase("loading");
    setObjectUrl(null);

    void renderFinishedBookCardPng(subject)
      .then((blob) => {
        const nextUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(nextUrl);
          return;
        }
        url = nextUrl;
        blobRef.current = blob;
        setObjectUrl(nextUrl);
        setPhase("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setPhase("error");
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [subject, attempt]);

  const download = useCallback(() => {
    if (phase !== "ready" || !blobRef.current) return;
    triggerFinishedBookShareDownload(blobRef.current, model.filename);
  }, [model.filename, phase]);

  const copyText = useCallback(async () => {
    if (phase !== "ready") return;
    try {
      await navigator.clipboard.writeText(model.text);
    } catch {
      toast(FINISHED_BOOK_SHARE_COPY.copyFailed);
    }
  }, [model.text, phase]);

  const openOnX = useCallback(() => {
    if (phase !== "ready") return;
    const popup = window.open(model.intentUrl, "_blank", "noopener,noreferrer");
    if (!popup) toast(FINISHED_BOOK_SHARE_COPY.popupBlocked);
  }, [model.intentUrl, phase]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return {
    phase,
    objectUrl,
    model,
    actionsDisabled,
    errorMessage:
      phase === "error" ? FINISHED_BOOK_SHARE_COPY.generateError : null,
    download,
    copyText,
    openOnX,
    retry,
  };
}
