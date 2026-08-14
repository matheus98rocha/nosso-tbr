import type { KeyboardEvent } from "react";

export type InputWithButtonProps = {
  placeholder: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onButtonClick?: (value: string) => void;
  onBlur?: (value: string) => void;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export type InputWithButtonRef = {
  clear: () => void;
};
