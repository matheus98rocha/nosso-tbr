import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Item = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  name?: string;
  label?: string;
  placeholder?: string;
  items: Item[];
  value?: string;
  onChange?: (value: string) => void;
};

export function SelectField({
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
