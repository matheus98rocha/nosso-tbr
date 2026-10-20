"use client";

import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { PopularReadersRevealProps } from "./types";

export default function PopularReadersReveal({
  onShow,
}: PopularReadersRevealProps) {
  return (
    <div className="mb-4 flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onShow}
        className="h-9 gap-1.5 px-2 text-xs text-muted-foreground"
        aria-label="Mostrar leitores populares"
      >
        <Users size={14} aria-hidden />
        Mostrar leitores populares
      </Button>
    </div>
  );
}
