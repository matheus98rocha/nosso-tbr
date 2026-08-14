import type { UserDomain } from "@/services/users/types/users.types";

export type StatsReaderOption = {
  id: string;
  label: string;
};

type ReaderOptionInput =
  | string
  | UserDomain
  | {
      id?: string;
      display_name?: string;
      label?: string;
      value?: string;
    };

export function normalizeStatsReaderOptions(
  options: ReaderOptionInput[],
): StatsReaderOption[] {
  return options
    .map((option) => {
      if (typeof option === "string") {
        return { id: option, label: option };
      }

      const record = option as {
        id?: string;
        display_name?: string;
        label?: string;
        value?: string;
      };

      const id = record.id ?? record.value;
      const label = record.display_name ?? record.label ?? id;

      if (!id || !label) {
        return null;
      }

      return {
        id: String(id),
        label: String(label),
      };
    })
    .filter((option): option is StatsReaderOption => option !== null);
}
