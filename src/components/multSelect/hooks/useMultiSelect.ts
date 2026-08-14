"use client";

import { useCallback, useMemo, useState } from "react";
import type { MultiSelectProps } from "../types/multiSelect.types";

export function useMultiSelect({
  options,
  selected,
  onChange,
}: Pick<MultiSelectProps, "options" | "selected" | "onChange">) {
  const [open, setOpen] = useState(false);

  const toggleValue = useCallback(
    (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [onChange, selected],
  );

  const selectedLabels = useMemo(
    () =>
      selected
        .map((val) => options.find((opt) => opt.value === val)?.label)
        .filter(Boolean) as string[],
    [options, selected],
  );

  return {
    open,
    setOpen,
    toggleValue,
    selectedLabels,
  };
}
