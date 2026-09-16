import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import CommunityScreen from "@/modules/community";
import { getCurrentUser } from "@/services/users/service/getCurrentUser.service";

export default async function CommunityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl px-4 py-7">
          <Skeleton className="h-112 w-full rounded-2xl" />
        </div>
      }
    >
      <CommunityScreen />
    </Suspense>
  );
}
