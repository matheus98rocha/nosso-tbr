import { useQuery } from "@tanstack/react-query";
import { UserDomain } from "../types/users.types";

export function useUser(): {
  users: UserDomain[];
  chosenByOptions: { label: string; value: string }[];
  isLoadingUsers: boolean;
} {
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users", {
        next: { tags: ["users"] },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const chosenByOptions = (users ?? []).map((user: UserDomain) => ({
    label: user.display_name,
    value: user.id,
  }));

  return { users, chosenByOptions, isLoadingUsers };
}
