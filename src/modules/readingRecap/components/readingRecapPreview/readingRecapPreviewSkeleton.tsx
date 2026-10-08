"use client";

import { Skeleton } from "@/components/ui/skeleton";

function ReadingRecapPreviewSkeleton() {
  return (
    <div
      className="mx-auto flex aspect-[9/16] w-[min(100%,360px)] flex-col overflow-hidden rounded-2xl bg-[#F3EDE3] px-3 pb-3 pt-4 shadow-[0_18px_40px_-24px_rgba(28,25,23,0.55)]"
      aria-busy="true"
      aria-label="Carregando recap de leitura"
    >
      <Skeleton className="mx-auto h-2.5 w-36 bg-[#E8DFD2]" />
      <div className="mt-3 grid min-h-0 flex-1 grid-cols-3 grid-rows-4 gap-1.5">
        {Array.from({ length: 12 }, (_, index) => (
          <Skeleton
            key={`recap-cover-skeleton-${index}`}
            className="h-full w-full rounded-md bg-[#E4DCCF]"
          />
        ))}
      </div>
      <Skeleton className="mx-auto mt-2 h-2 w-20 bg-[#E8DFD2]" />
    </div>
  );
}

export default ReadingRecapPreviewSkeleton;
