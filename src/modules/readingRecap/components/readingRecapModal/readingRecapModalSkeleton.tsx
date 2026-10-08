"use client";

import { Skeleton } from "@/components/ui/skeleton";

import ReadingRecapPreviewSkeleton from "../readingRecapPreview/readingRecapPreviewSkeleton";

function ReadingRecapModalSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3" aria-hidden>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-8 w-12 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-8 w-40 rounded-md" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <ReadingRecapPreviewSkeleton />
      </div>
    </div>
  );
}

export default ReadingRecapModalSkeleton;
