"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import AuthorsScreen from "@/modules/authors";
import { useIsAdmin, useIsLoggedIn } from "@/stores/hooks/useAuth";

function Authors() {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/auth");
      return;
    }
    if (!isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isLoggedIn, router]);

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className="w-full flex items-center justify-center flex-col gap-4 container">
      <AuthorsScreen />
    </div>
  );
}

export default Authors;
