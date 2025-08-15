import React from "react";
import { Button } from "../ui/button";

type BlurOverlayProps = {
  showOverlay: boolean;
  children: React.ReactNode;
  overlayContent?: React.ReactNode;
};

export function BlurOverlay({
  showOverlay,
  children,
  overlayContent = (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg font-medium text-gray-800">
        Faça login para continuar
      </p>
      <Button>Entrar</Button>
    </div>
  ),
}: BlurOverlayProps) {
  return (
    <div className="relative h-full w-full">
      {children}
      {showOverlay && (
        <div className="absolute inset-0 z-50 backdrop-blur-sm bg-white/70 flex items-center justify-center">
          {overlayContent}
        </div>
      )}
    </div>
  );
}
