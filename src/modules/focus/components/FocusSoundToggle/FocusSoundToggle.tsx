"use client";

import { Volume2, VolumeX } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import type { FocusSoundToggleProps } from "../../types/focus.components.types";

export default function FocusSoundToggle({
  muted,
  onToggle,
}: FocusSoundToggleProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1.5">
      {muted ? (
        <VolumeX aria-hidden className="size-4 text-muted-foreground" />
      ) : (
        <Volume2 aria-hidden className="size-4 text-muted-foreground" />
      )}
      <Label htmlFor="focus-sound" className="cursor-pointer text-xs">
        Som ao finalizar
      </Label>
      <Switch
        id="focus-sound"
        checked={!muted}
        aria-label="Som ao finalizar"
        onCheckedChange={onToggle}
      />
    </div>
  );
}
