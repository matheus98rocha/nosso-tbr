import { cn } from "@/lib/utils";

import type { ReviewBookStatusBadgeProps } from "../types";
import { currentBookStatus } from "../utils";

export default function ReviewBookStatusBadge({ status }: ReviewBookStatusBadgeProps) {
  const presentation = currentBookStatus(status);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        presentation.colorClass,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", presentation.dotClass)} />
      <span className="truncate">{presentation.label}</span>
    </span>
  );
}
