import { Skeleton } from "@/components/ui/skeleton";

export function NavSkeleton() {
  return (
    <nav
      className="desktop-nav"
      aria-hidden="true"
    >
      <ul>
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i}>
            <div className="desktop-nav__link flex flex-col items-center gap-1.5 px-3 py-2 min-w-[52px] min-h-[44px] justify-center">
              <Skeleton className="w-[18px] h-[18px] rounded-md" />
              <Skeleton className="h-2.5 w-14 rounded-sm" />
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
