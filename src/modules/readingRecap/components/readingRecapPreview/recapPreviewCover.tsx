"use client";

import { X } from "lucide-react";

import type { RecapPreviewCoverProps } from "../../types";

function RecapPreviewCover({
  cover,
  onRemove,
  onCoverError,
}: RecapPreviewCoverProps) {
  const removeLabel = cover.title
    ? `Remover ${cover.title} do recap`
    : "Remover livro do recap";

  return (
    <div className="relative flex min-h-0 min-w-0 items-center justify-center">
      <img
        src={cover.src}
        alt=""
        className="aspect-[90/130] h-full max-h-full w-auto max-w-full rounded-md object-cover shadow-sm"
        onError={() => onCoverError?.(cover.bookId)}
      />
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          className="absolute right-0.5 top-0.5 z-20 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white shadow-sm transition-colors hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          onClick={() => onRemove(cover.bookId)}
        >
          <X className="size-3" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export default RecapPreviewCover;
