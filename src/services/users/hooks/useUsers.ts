import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../service/getUsers.service";
import { UserDomain } from "../types/users.types";

export function useUser(): {
  users: UserDomain[];
  chosenByOptions: { label: string; value: string }[];
  isLoadingUsers: boolean;
} {
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const chosenByOptions = (users ?? []).map((user: UserDomain) => ({
    label: user.display_name,
    value: user.id,
  }));

  return { users, chosenByOptions, isLoadingUsers };
}
