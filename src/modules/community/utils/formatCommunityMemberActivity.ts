export type CommunityMemberActivityInput = {
  registeredCount: number;
  finishedCount: number;
  currentlyReadingTitle: string | null;
};

export type CommunityMemberActivityLabels = {
  countsLabel: string;
  currentlyReadingLabel: string | null;
};

export function formatCommunityMemberActivity({
  registeredCount,
  finishedCount,
  currentlyReadingTitle,
}: CommunityMemberActivityInput): CommunityMemberActivityLabels {
  const trimmedTitle = currentlyReadingTitle?.trim() ?? "";

  return {
    countsLabel: `${formatCount(registeredCount, "cadastrado", "cadastrados")} · ${formatCount(finishedCount, "lido", "lidos")}`,
    currentlyReadingLabel:
      trimmedTitle.length > 0 ? `Lendo ${trimmedTitle}` : null,
  };
}

function formatCount(
  count: number,
  singular: string,
  pluralWord: string,
): string {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}
