import { genders } from "@/constants/genders";
import { STATUS_DICTIONARY } from "@/constants/statusDictionary";

export function formatList(items: string[]) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} e ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

export function formatGenres(genderFilters?: string[] | null) {
  if (!Array.isArray(genderFilters) || genderFilters.length === 0) return null;
  const labels = genderFilters.map(
    (value: string) => genders.find((g) => g.value === value)?.label ?? value
  );
  return formatList(labels);
}

export function formatReaders(readers?: string[] | null) {
  if (!Array.isArray(readers) || readers.length === 0) return null;
  return formatList(readers);
}

export function formatStatus(status?: string[] | null) {
  if (!Array.isArray(status) || status.length === 0) return null;
  return formatList(
    status.map(
      (value: string) =>
        `"${
          STATUS_DICTIONARY[value as keyof typeof STATUS_DICTIONARY] ?? value
        }"`
    )
  );
}
