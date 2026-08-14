"use client";

import { useCallback, useMemo, useState } from "react";
import type { DatePickerProps } from "../types/datePicker.types";

export function useDatePicker({
  value,
  onChange,
  isAfterTodayHidden,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const calendarHidden = useMemo(
    () => (isAfterTodayHidden ? { after: new Date() } : undefined),
    [isAfterTodayHidden],
  );

  const displayLabel = useMemo(
    () => (value ? value.toLocaleDateString() : "Selecione uma data"),
    [value],
  );

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      onChange?.(date);
      setOpen(false);
    },
    [onChange],
  );

  return {
    open,
    setOpen,
    calendarHidden,
    displayLabel,
    handleSelect,
  };
}
