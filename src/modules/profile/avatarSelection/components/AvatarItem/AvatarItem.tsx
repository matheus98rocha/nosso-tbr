import { memo } from "react";

import { cn } from "@/lib/utils";
import type { AvatarItemProps } from "@/modules/profile/avatarSelection/types/avatarItem.types";

function AvatarItemComponent({
  seed,
  imageUrl,
  optionIndex,
  isSelected,
  isDisabled,
  onSelect,
}: AvatarItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(seed)}
      disabled={isDisabled}
      aria-pressed={isSelected}
      aria-label={`Selecionar avatar ${optionIndex + 1}`}
      className={cn(
        "group relative flex items-center justify-center rounded-2xl border p-2 transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
        isSelected
          ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/40"
          : "border-zinc-200 bg-white/70 hover:border-violet-300 hover:bg-violet-50/50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-violet-700 dark:hover:bg-violet-950/20",
        isDisabled && "pointer-events-none opacity-60",
      )}
    >
      <span
        className={cn(
          "relative size-16 overflow-hidden rounded-xl bg-violet-100 dark:bg-violet-950/50",
          isSelected &&
            "ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900",
        )}
      >
        <img
          src={imageUrl}
          alt=""
          aria-hidden
          width={64}
          height={64}
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </span>
    </button>
  );
}

export default memo(AvatarItemComponent);
