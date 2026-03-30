import { getCurrentUser } from "@/services/users/service/getCurrentUser.service";
import ClientProfile from "@/modules/profile";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  return (
    <Suspense
      fallback={
        <Skeleton className="h-112 w-full max-w-3xl mx-auto rounded-2xl" />
      }
    >
      <ClientProfile />
    </Suspense>
  );
}
