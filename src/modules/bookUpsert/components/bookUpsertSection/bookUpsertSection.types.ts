import type { ReactNode } from "react";

export interface BookUpsertSectionProps {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}
