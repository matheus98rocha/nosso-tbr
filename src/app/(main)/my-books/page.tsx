// app/(main)/my-books/page.tsx
import ClientMyBooks from "@/modules/myBooks";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<Skeleton className="w-full h-[500px]" />}>
      <ClientMyBooks />
    </Suspense>
  );
}
