import { useCallback, useState } from "react";

export function useBookFiltersCollapse(initialCollapsed = true) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((previous) => !previous);
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  return {
    isCollapsed,
    toggleCollapse,
    expand,
    collapse,
  };
}
