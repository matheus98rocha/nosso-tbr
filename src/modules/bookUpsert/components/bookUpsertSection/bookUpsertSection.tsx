import { cn } from "@/lib/utils";

import type { BookUpsertSectionProps } from "./bookUpsertSection.types";

function BookUpsertSection({
  title,
  description,
  icon,
  children,
  className,
}: BookUpsertSectionProps) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-2xl border border-zinc-200/80 p-4",
        "bg-[linear-gradient(165deg,rgba(255,253,248,0.95),rgba(250,246,239,0.55))]",
        "dark:border-zinc-700/70 dark:bg-[linear-gradient(165deg,rgba(39,39,42,0.55),rgba(24,24,27,0.35))]",
        "shadow-[0_1px_0_rgba(255,255,255,0.65)_inset]",
        "dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]",
        className,
      )}
    >
      <header className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
            "bg-zinc-900/95 text-zinc-50",
            "dark:bg-zinc-100 dark:text-zinc-900",
          )}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          {description ? (
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}

export default BookUpsertSection;
