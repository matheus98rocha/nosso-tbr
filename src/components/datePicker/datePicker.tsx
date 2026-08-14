"use client";

import * as React from "react";
import { memo } from "react";
import { ChevronDownIcon } from "lucide-react";
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
}: DatePickerProps) {
  const { open, setOpen, calendarHidden, displayLabel, handleSelect } =
    useDatePicker({ value, onChange, isAfterTodayHidden });

  return (
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
      </PopoverContent>
    </Popover>
  );
}

export const DatePicker = memo(DatePickerComponent);
