export type SelectFieldItem = {
  label: string;
  value: string;
};

export type SelectFieldProps = {
  name?: string;
  label?: string;
  placeholder?: string;
  items: SelectFieldItem[];
  value?: string;
  onChange?: (value: string) => void;
};
