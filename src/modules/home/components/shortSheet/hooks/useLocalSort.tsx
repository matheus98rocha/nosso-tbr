import { useCallback, useState } from "react";

export const SORT_OPTIONS = [
  { label: "Título (A–Z)", value: "title_asc" },
  { label: "Título (Z–A)", value: "title_desc" },
  { label: "Mais páginas", value: "pages_desc" },
  { label: "Menos páginas", value: "pages_asc" },
  { label: "Mais recentes", value: "date_desc" },
  { label: "Mais antigos", value: "date_asc" },
  { label: "Autor (A–Z)", value: "author_asc" },
  { label: "Autor (Z–A)", value: "author_desc" },
];

export const useLocalSort = (initialSort: string) => {
  const [localSort, setLocalSort] = useState<string>(initialSort);

  const handleSortChange = useCallback((value: string) => {
    setLocalSort(value);
  }, []);

  const resetLocalSort = useCallback((value: string) => {
    setLocalSort(value);
  }, []);

  return {
    localSort,
    handleSortChange,
    resetLocalSort,
  };
};
