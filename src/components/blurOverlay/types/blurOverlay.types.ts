import type { ReactNode } from "react";

export type BlurOverlayProps = {
  showOverlay: boolean;
  children: ReactNode;
  overlayContent?: ReactNode;
};
