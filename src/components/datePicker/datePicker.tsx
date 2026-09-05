"use client";

import * as React from "react";
import { memo } from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useDatePicker } from "./hooks/useDatePicker";
import type { DatePickerProps } from "./types/datePicker.types";

function DatePickerComponent({
  value,
  onChange,
  isAfterTodayHidden,
  isRequiredField,
  allowClear,
}: DatePickerProps) {
  const {
    open,
    setOpen,
    calendarHidden,
    displayLabel,
    handleSelect,
    handleClear,
    showClear,
  } = useDatePicker({
    value,
    onChange,
    isAfterTodayHidden,
    isRequiredField,
    allowClear,
  });

  return (
    <div className="flex w-full items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id="date"
            className="w-full justify-between font-normal"
          >
            {displayLabel}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={handleSelect}
            hidden={calendarHidden}
          />
          {showClear ? (
            <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-full text-xs text-zinc-600 dark:text-zinc-300"
                onClick={handleClear}
              >
                Limpar data
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      {showClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          aria-label="Limpar data"
          onClick={handleClear}
        >
          <XIcon className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

export const DatePicker = memo(DatePickerComponent);
