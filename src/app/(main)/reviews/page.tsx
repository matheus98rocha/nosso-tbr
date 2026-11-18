import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import ReviewsScreen from "@/modules/reviews";
import { getCurrentUser } from "@/services/users/service/getCurrentUser.service";

export default async function ReviewsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-2xl space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      }
    >
      <ReviewsScreen />
    </Suspense>
  );
}
