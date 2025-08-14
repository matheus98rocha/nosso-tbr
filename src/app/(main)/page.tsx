import { Skeleton } from "@/components/ui/skeleton";
import ClientHome from "@/modules/home";
import React, { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ClientHome />
    </Suspense>
  );
}
