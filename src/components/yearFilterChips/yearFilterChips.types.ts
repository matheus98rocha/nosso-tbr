export interface YearFilterChipsProps {
  activeYear: number | undefined;
  onSelect: (year: number | undefined) => void;
  isLoading: boolean;
}
