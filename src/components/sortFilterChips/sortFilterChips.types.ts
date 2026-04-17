import { SortOption } from "@/types/filters";

export interface SortChipConfig {
  value: SortOption;
  label: string;
  ariaLabel: string;
}

export interface SortFilterChipsProps {
  activeSort?: SortOption;
  onSelect: (sort: SortOption | undefined) => void;
  isLoading?: boolean;
}
