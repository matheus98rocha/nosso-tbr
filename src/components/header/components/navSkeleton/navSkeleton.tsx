import { Skeleton } from "@/components/ui/skeleton";

export function NavSkeleton() {
  return (
    <nav
      className="flex items-center justify-center gap-8 mb-4"
      aria-hidden="true"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          {/* Simula o ícone Lucide */}
          <Skeleton className="w-6 h-6 rounded-full bg-gray-200" />

          {/* Simula o label de texto */}
          <Skeleton className="h-3 w-16 bg-gray-200" />
        </div>
      ))}
    </nav>
  );
}
