export type ChosenByOption = {
  label: string;
  value: string;
};

export function mergeChosenByOptions(
  networkOptions: ChosenByOption[],
  readerIds: string[] | undefined,
  readersDisplay: string | undefined,
): ChosenByOption[] {
  if (!readerIds?.length) {
    return networkOptions;
  }

  const byId = new Map(networkOptions.map((option) => [option.value, option]));
  const labels = (readersDisplay ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  readerIds.forEach((id, index) => {
    if (!id || byId.has(id)) return;
    byId.set(id, {
      value: id,
      label: labels[index] || "Leitor",
    });
  });

  return [...byId.values()];
}
