import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";

type Option = { label: string; value: string };

type MultiSelectProps = {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedLabels = selected
    .map((val) => options.find((opt) => opt.value === val)?.label)
    .filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {selectedLabels.length > 0
            ? selectedLabels.length === 1
              ? selectedLabels[0]
              : `${selectedLabels.length} selecionados`
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px]"
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement)?.closest(".multi-select-item")) return;
        }}
      >
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {options.map(({ label, value }) => {
            const isChecked = selected.includes(value);
            return (
              <div
                key={value}
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-all multi-select-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggleValue(value)}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => {}}
                  className="pointer-events-none"
                />
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
