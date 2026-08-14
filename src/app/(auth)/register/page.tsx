import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ClientRegister from "@/modules/register";
import React, { Suspense } from "react";

function RegisterPageSkeleton() {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-muted p-4">
      <Card className="mx-auto w-full max-w-sm border-border bg-card md:w-96 lg:w-[400px]">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-12 shrink-0 rounded-md" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-4 w-full max-w-[280px]" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
        </CardContent>
      </Card>
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
