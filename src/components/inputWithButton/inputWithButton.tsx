"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type {
  InputWithButtonProps,
  InputWithButtonRef,
} from "./types/inputWithButton.types";

export type { InputWithButtonRef };

export const InputWithButton = forwardRef<
  InputWithButtonRef,
  InputWithButtonProps
>(
  (
    {
      placeholder,
      defaultValue,
      value,
      onChange,
      onButtonClick,
      onBlur,
      onFocus,
      onKeyDown,
    },
    ref,
  ) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");
  const isControlled = typeof value === "string";
  const currentValue = isControlled ? value : innerValue;

  useEffect(() => {
    if (!isControlled) {
      setInnerValue(defaultValue ?? "");
    }
  }, [defaultValue, isControlled]);

  useImperativeHandle(ref, () => ({
    clear() {
      if (isControlled) {
        onChange?.("");
        return;
      }
      setInnerValue("");
    },
  }));

  const handleSearchClick = () => {
    onButtonClick?.(currentValue ?? "");
  };

  const handleBlur = () => {
    onBlur?.(currentValue ?? "");
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    if (!isControlled) {
      setInnerValue(newValue);
    }

    onChange?.(newValue);
  };

  return (
    <div className="relative w-full">
      <Input
        type="search"
        placeholder={placeholder}
        value={currentValue}
        ref={inputRef}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      />
      <Button
        type="button"
        onClick={handleSearchClick}
        variant="secondary"
        className="absolute top-1/2 -translate-y-1/2 right-0.5 h-8 w-8 p-0 border-l border border-r-0 border-input border-y-0 rounded-l-none"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
},
);

InputWithButton.displayName = "InputWithButton";
