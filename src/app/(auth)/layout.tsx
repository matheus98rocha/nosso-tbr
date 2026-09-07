import type { ReactNode } from "react";
import { Newsreader } from "next/font/google";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-auth-display",
  display: "swap",
});

export const metadata = {
  title: "Auth - Nosso TBR",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section
      aria-label="Autenticação"
      className={newsreader.variable}
    >
      {children}
    </section>
  );
}
