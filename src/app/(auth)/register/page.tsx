import React, { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import ClientRegister from "@/modules/register";

function RegisterPageSkeleton() {
  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-[oklch(0.96_0.01_264)]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:px-6 lg:py-10">
        <div className="min-h-[220px] bg-[oklch(0.18_0.04_264)] lg:min-h-0 lg:rounded-2xl" />
        <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6 lg:items-center">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-border/70 bg-card p-6 shadow-sm">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-[280px]" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageSkeleton />}>
      <ClientRegister />
    </Suspense>
  );
}
