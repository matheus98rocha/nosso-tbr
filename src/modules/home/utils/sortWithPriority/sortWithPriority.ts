import { UserDomain } from "@/services/users/types/users.types";

export default function sortWithPriority(
  names: UserDomain[],
  priorityName: string,
): UserDomain[] {
  const normalizedPriority = priorityName.toLowerCase();

  const sorted = [...names].sort((a, b) => {
    const aLower = a.display_name.toLowerCase();
    const bLower = b.display_name.toLowerCase();

    if (aLower === normalizedPriority) return -1;
    if (bLower === normalizedPriority) return 1;

    return aLower.localeCompare(bLower);
  });

  return sorted;
}
