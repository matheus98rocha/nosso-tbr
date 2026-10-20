export type AutocompleteItem = {
  id: string | number;
  name: string;
};

export type AutocompleteProps = {
  items: AutocompleteItem[];
  value?: string | number | string[];
  initialLabel?: string;
  initialLabels?: Record<string, string>;
  isLoading?: boolean;
  onValueChange?: (currentValue: string) => void;
  onValuesChange?: (currentValues: string[]) => void;
  onSearch?: (search: string) => void;
  onClear?: () => void;
  onAddNew?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  multiple?: boolean;
};
