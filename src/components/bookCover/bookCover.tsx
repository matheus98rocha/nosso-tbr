"use client";

import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useBookCover } from "./hooks/useBookCover";
import type { BookCoverProps } from "./types/bookCover.types";

export default function BookCover({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  priority = false,
}: BookCoverProps) {
  const { imageSrc, isLoading, handleLoad, handleError } = useBookCover(src);

  return (
    <div
      className={cn("relative overflow-hidden bg-muted/20", containerClassName)}
      style={{ width, height }}
    >
      {isLoading ? (
        <Skeleton
          className="absolute inset-0 size-full rounded-[inherit]"
          aria-hidden
        />
      ) : null}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "size-full object-cover transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100",
          className,
        )}
        loading={priority ? undefined : "lazy"}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
