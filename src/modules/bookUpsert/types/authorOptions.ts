export interface ComboboxOption {
  id: string;
  name: string;
}

export interface AutocompleteProps {
  items: ComboboxOption[];
  value: string | number;
  onValueChange?: (currentValue: string) => void;
  onSearch?: (search: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}
