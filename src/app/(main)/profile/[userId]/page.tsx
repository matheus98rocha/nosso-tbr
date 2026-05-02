import { getCurrentUser } from "@/services/users/service/getCurrentUser.service";
import MemberProfileView from "@/modules/profile/memberProfile";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function MemberProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  const parsed = z.string().uuid().safeParse(userId);
  if (!parsed.success) {
    notFound();
  }

  if (parsed.data === user.id) {
    redirect("/profile");
  }

  return (
    <Suspense
      fallback={
        <Skeleton className="h-112 w-full max-w-3xl mx-auto rounded-2xl" />
      }
    >
      <MemberProfileView userId={parsed.data} />
    </Suspense>
  );
}
