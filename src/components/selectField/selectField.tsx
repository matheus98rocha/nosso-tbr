import { memo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectFieldProps } from "./types/selectField.types";

function SelectFieldComponent({
  name,
  label,
  placeholder,
  items,
  value,
  onChange,
}: SelectFieldProps) {
  return (
    <Select value={value} onValueChange={onChange} name={name}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder || "Selecione uma opção"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {label && <SelectLabel>{label}</SelectLabel>}
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export const SelectField = memo(SelectFieldComponent);
