"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
  title: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  isRequiredField?: boolean;
  isAfterTodayHidden?: boolean;
};

export function DatePicker({
  title,
  value,
  onChange,
  isAfterTodayHidden,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="grid gap-3">
      <Label htmlFor="date" className="px-1">
        {title}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-full justify-between font-normal"
          >
            {value ? value.toLocaleDateString() : "Selecione uma data"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
            hidden={isAfterTodayHidden ? { after: new Date() } : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
