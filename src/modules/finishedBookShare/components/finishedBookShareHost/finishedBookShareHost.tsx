"use client";

import { FinishedBookShareDialog } from "../finishedBookShareDialog";
import { useFinishedBookShareStore } from "../../stores";

export function FinishedBookShareHost() {
  const activeSubject = useFinishedBookShareStore((state) => state.activeSubject);
  const close = useFinishedBookShareStore((state) => state.close);

  if (!activeSubject) return null;

  return (
    <FinishedBookShareDialog subject={activeSubject} open onClose={close} />
  );
}
