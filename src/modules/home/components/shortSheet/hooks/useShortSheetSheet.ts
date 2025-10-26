import { useCallback, useState } from "react";

export type SortOption = {
  label: string;
  value: string;
};

export const SORT_OPTIONS: SortOption[] = [
  { label: "Título (A–Z)", value: "title_asc" },
  { label: "Título (Z–A)", value: "title_desc" },
  { label: "Mais páginas", value: "pages_desc" },
  { label: "Menos páginas", value: "pages_asc" },
  { label: "Mais recentes", value: "date_desc" },
  { label: "Mais antigos", value: "date_asc" },
  { label: "Autor (A–Z)", value: "author_asc" },
  { label: "Autor (Z–A)", value: "author_desc" },
];

export type UseSortSheetProps = {
  initialSort?: string;
  onApplySort: (value: string) => void;
};

export const useSortSheet = ({
  initialSort = "",
  onApplySort,
}: UseSortSheetProps) => {
  const [open, setOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(initialSort);

  const handleSortChange = useCallback((value: string) => {
    setSelectedSort(value);
  }, []);

  const handleApplySort = useCallback(() => {
    onApplySort(selectedSort);
    setOpen(false);
  }, [selectedSort, onApplySort]);

  const handleResetSort = useCallback(() => {
    setSelectedSort("");
    onApplySort("");
  }, [onApplySort]);

  return {
    open,
    setOpen,
    selectedSort,
    handleSortChange,
    handleApplySort,
    handleResetSort,
    SORT_OPTIONS,
  };
};
