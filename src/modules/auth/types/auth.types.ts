import type { ReactNode } from "react";

export type AuthShellProps = {
  children: ReactNode;
  brand: ReactNode;
};

export type AuthBrandPanelProps = {
  title: string;
  description: string;
  badge?: ReactNode;
};
