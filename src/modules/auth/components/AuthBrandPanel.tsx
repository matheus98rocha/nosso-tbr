"use client";

import { motion, useReducedMotion } from "framer-motion";

import LogoIcon from "@/assets/icons/logo";
import type { AuthBrandPanelProps } from "@/modules/auth/types";

export default function AuthBrandPanel({
  title,
  description,
  badge,
}: AuthBrandPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden px-8 py-10 text-[oklch(0.97_0.01_85)] md:min-h-0 md:px-12 md:py-14 lg:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,oklch(0.45_0.12_264/0.55),transparent_55%),radial-gradient(ellipse_at_90%_80%,oklch(0.42_0.1_175/0.35),transparent_50%),linear-gradient(160deg,oklch(0.22_0.05_264)_0%,oklch(0.16_0.04_268)_48%,oklch(0.14_0.035_270)_100%)]"
      />
      <div
        aria-hidden
        className="auth-noise pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-soft-light"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 top-1/2 flex -translate-y-1/2 gap-2 opacity-40 md:right-8 md:gap-3"
      >
        {[
          { h: "h-40 md:h-56", color: "bg-[#6C5CE7]" },
          { h: "h-52 md:h-72", color: "bg-[#00B894]" },
          { h: "h-36 md:h-48", color: "bg-[#FF79A8]" },
        ].map((spine, index) => (
          <motion.span
            key={spine.color}
            initial={reduceMotion ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.15 + index * 0.08,
              duration: 0.55,
              ease: [0.33, 1, 0.68, 1],
            }}
            className={`${spine.h} w-3 rounded-sm shadow-[inset_-2px_0_0_rgba(255,255,255,0.22)] md:w-4 ${spine.color}`}
          />
        ))}
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
        className="relative z-10 space-y-5"
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex size-14 shrink-0 drop-shadow-md [&>svg]:size-full md:size-16"
            aria-hidden
          >
            <LogoIcon />
          </span>
          <p className="font-[family-name:var(--font-auth-display)] text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
            Nosso TBR
          </p>
        </div>

        {badge ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.35 }}
          >
            {badge}
          </motion.div>
        ) : null}

        <div className="max-w-md space-y-3">
          <h1 className="font-[family-name:var(--font-auth-display)] text-2xl font-semibold leading-tight text-white md:text-3xl lg:text-[2.15rem]">
            {title}
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-white/75 md:text-base">
            {description}
          </p>
        </div>
      </motion.div>

      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="relative z-10 mt-8 hidden text-xs tracking-[0.18em] text-white/45 uppercase md:block"
      >
        Estante compartilhada · metas · descobertas
      </motion.p>
    </div>
  );
}
