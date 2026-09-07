"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { AuthShellProps } from "@/modules/auth/types";

export default function AuthShell({ children, brand }: AuthShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-[oklch(0.96_0.01_264)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.92_0.03_264/0.9),transparent_50%),radial-gradient(ellipse_at_bottom_left,oklch(0.93_0.02_175/0.55),transparent_45%)]"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:px-6 lg:py-10">
        <motion.aside
          initial={reduceMotion ? false : { opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          className="relative lg:rounded-2xl lg:shadow-[0_24px_80px_-32px_oklch(0.2_0.05_264/0.55)]"
        >
          <div className="h-full overflow-hidden lg:rounded-2xl">{brand}</div>
        </motion.aside>

        <motion.main
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reduceMotion ? 0 : 0.12,
            duration: 0.5,
            ease: [0.33, 1, 0.68, 1],
          }}
          className="relative z-10 flex flex-1 items-start justify-center px-4 py-8 sm:px-6 lg:items-center lg:py-6"
        >
          <div className="w-full max-w-md">{children}</div>
        </motion.main>
      </div>
    </div>
  );
}
