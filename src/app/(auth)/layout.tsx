// /app/auth/layout.tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "Auth - Nosso TBR",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <section aria-label="Autenticação">{children}</section>;
}
