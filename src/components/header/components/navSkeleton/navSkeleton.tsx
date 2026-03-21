import { Skeleton } from "@/components/ui/skeleton";

export function NavSkeleton() {
  return (
    <nav
      className="flex items-center justify-center gap-1 mb-2"
      aria-hidden="true"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1.5 px-3 py-2 min-w-[52px] min-h-[44px] justify-center"
        >
          <Skeleton className="w-[18px] h-[18px] rounded-md" />
          <Skeleton className="h-2.5 w-14 rounded-sm" />
        </div>
      ))}
    </nav>
  );
}
