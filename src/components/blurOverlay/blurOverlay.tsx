"use client";

import { memo } from "react";
import { Button } from "../ui/button";
import { useBlurOverlay } from "./hooks/useBlurOverlay";
import type { BlurOverlayProps } from "./types/blurOverlay.types";

function BlurOverlayComponent({
  showOverlay,
  children,
  overlayContent,
}: BlurOverlayProps) {
  const { goToAuth } = useBlurOverlay();

  return (
    <>
      {children}
      {showOverlay && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm bg-white/50 rounded">
          {overlayContent ?? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg font-medium text-gray-800">
                Faça login para continuar
              </p>
              <Button type="button" onClick={goToAuth}>
                Entrar
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export const BlurOverlay = memo(BlurOverlayComponent);
