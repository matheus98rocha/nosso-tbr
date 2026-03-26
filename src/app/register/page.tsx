import { Skeleton } from "@/components/ui/skeleton";
import ClientRegister from "@/modules/register";
import React, { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full max-w-sm" />}>
      <ClientRegister />
    </Suspense>
  );
}
