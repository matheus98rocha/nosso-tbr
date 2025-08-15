import React from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

type BlurOverlayProps = {
  showOverlay: boolean;
  children: React.ReactNode;
  overlayContent?: React.ReactNode;
};

export function BlurOverlay({
  showOverlay,
  children,
  overlayContent,
}: BlurOverlayProps) {
  const router = useRouter();

  return (
    <>
      {children}
      {showOverlay && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm bg-white/50">
          {overlayContent ?? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg font-medium text-gray-800">
                Faça login para continuar
              </p>
              <Button onClick={() => router.push("/auth")}>Entrar</Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
