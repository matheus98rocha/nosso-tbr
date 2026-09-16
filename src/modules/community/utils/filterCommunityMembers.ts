import type {
  CommunityMember,
  CommunityView,
} from "../types/community.types";

export function parseCommunityView(raw: string | null | undefined): CommunityView {
  if (raw === "seguidores" || raw === "seguindo" || raw === "todos") {
    return raw;
  }

  return "todos";
}

export function normalizeCommunitySearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function filterCommunityMembers(
  members: CommunityMember[],
  options: {
    view: CommunityView;
    search: string;
    selfId: string;
  },
): CommunityMember[] {
  const term = normalizeCommunitySearch(options.search);

  return members
    .filter((member) => member.id !== options.selfId)
    .filter((member) => {
      if (options.view === "seguidores") {
        return member.isFollower;
      }

      if (options.view === "seguindo") {
        return member.isFollowing;
      }

      return true;
    })
    .filter((member) => {
      if (!term) {
        return true;
      }

      return normalizeCommunitySearch(member.displayName).includes(term);
    })
    .slice()
    .sort((left, right) =>
      left.displayName.localeCompare(right.displayName, "pt-BR"),
    );
}
