"use client";

import { useCallback, useMemo, useState } from "react";

import type { DatePickerProps } from "../types/datePicker.types";

export function useDatePicker({
  value,
  onChange,
  isAfterTodayHidden,
  isRequiredField = false,
  allowClear,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const canClear = useMemo(() => {
    if (allowClear === false) return false;
    if (isRequiredField) return false;
    return allowClear === true || allowClear === undefined;
  }, [allowClear, isRequiredField]);

  const showClear = Boolean(canClear && value);

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

  const handleClear = useCallback(() => {
    if (!canClear) return;
    onChange?.(undefined);
    setOpen(false);
  }, [canClear, onChange]);

  return {
    open,
    setOpen,
    calendarHidden,
    displayLabel,
    handleSelect,
    handleClear,
    showClear,
  };
}
