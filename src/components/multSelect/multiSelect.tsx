"use client";

import { memo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";
import { useMultiSelect } from "./hooks/useMultiSelect";
import type { MultiSelectProps } from "./types/multiSelect.types";

function MultiSelectComponent({
  options,
  selected,
  onChange,
  placeholder = "Select options",
}: MultiSelectProps) {
  const { open, setOpen, toggleValue, selectedLabels } = useMultiSelect({
    options,
    selected,
    onChange,
  });

  const triggerLabel =
    selectedLabels.length > 0
      ? selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selecionados`
      : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] max-h-60 overflow-y-auto"
        side="bottom"
        align="start"
      >
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {options.map(({ label, value }) => {
            const isChecked = selected.includes(value);
            return (
              <div
                key={value}
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-all multi-select-item min-h-11"
                onClick={() => toggleValue(value)}
              >
                <Checkbox checked={isChecked} onCheckedChange={() => {}} />
                <span className="text-sm">{label}</span>
                {isChecked && (
                  <Check className="h-4 w-4 ml-auto text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const MultiSelect = memo(MultiSelectComponent);
