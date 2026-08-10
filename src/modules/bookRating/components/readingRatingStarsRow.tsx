import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

import type { ReadingRatingStarsRowProps } from "../types/bookRating.types";

export default function ReadingRatingStarsRow({
  displayValue,
  disabled,
  onPick,
  ariaOwnsSuffix,
}: ReadingRatingStarsRowProps) {
  const groupDescId =
    ariaOwnsSuffix !== undefined
      ? `rating-stars-description-${ariaOwnsSuffix}`
      : undefined;

  return (
    <div className="flex flex-col gap-1">
      {groupDescId !== undefined ? (
        <p id={groupDescId} className="sr-only">
          {displayValue !== null
            ? `Nota atual: ${displayValue} estrelas de 5`
            : "Escolha de 1 a 5 estrelas para avaliar esta leitura"}
        </p>
      ) : null}
      <div
        className="flex items-center gap-0.5"
        role="group"
        {...(groupDescId !== undefined
          ? { "aria-labelledby": groupDescId }
          : {})}
      >
        {[1, 2, 3, 4, 5].map((step) => {
          const filled = displayValue !== null && step <= displayValue;
          const label =
            step === 1
              ? `${step} estrela (pior)`
              : step === 5
                ? `${step} estrelas (ótima)`
                : `${step} estrelas`;

          return (
            <button
              key={step}
              type="button"
              disabled={disabled}
              aria-label={label}
              aria-pressed={filled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPick(step);
              }}
              className={cn(
                "inline-flex cursor-pointer rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/90 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950",
                disabled && "cursor-not-allowed opacity-60",
                !filled && "text-zinc-300 dark:text-zinc-600",
                filled &&
                  "text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300",
              )}
            >
              <Star
                className={cn("size-5", filled ? "fill-current" : "")}
                strokeWidth={1.5}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
