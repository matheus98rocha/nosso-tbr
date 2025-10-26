import { Skeleton } from "@/components/ui/skeleton";
import ClientMyBooks from "@/modules/myBooks";
import React, { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ClientMyBooks />
    </Suspense>
  );
}
