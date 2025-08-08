"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type InputWithButtonProps = {
  placeholder: string;
  defaultValue?: string;
  onButtonClick?: (value: string) => void;
  onBlur?: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

export type InputWithButtonRef = {
  clear: () => void;
};

export const InputWithButton = forwardRef<
  InputWithButtonRef,
  InputWithButtonProps
>(({ placeholder, defaultValue, onButtonClick, onBlur, onKeyDown }, ref) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(ref, () => ({
    clear() {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
  }));

  const handlePressEnter = () => {
    const val = inputRef.current?.value ?? "";
    onButtonClick?.(val);
  };

  const handleBlur = () => {
    const val = inputRef.current?.value ?? "";
    onBlur?.(val);
  };

  return (
    <div className="relative w-full">
      <Input
        type="search"
        placeholder={placeholder}
        defaultValue={defaultValue}
        ref={inputRef}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
      />
      <Button
        type="button"
        onClick={handlePressEnter}
        variant="secondary"
        className="absolute top-1/2 -translate-y-1/2 right-0.5 h-8 w-8 p-0 border-l border border-r-0 border-input border-y-0 rounded-l-none"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
});

InputWithButton.displayName = "InputWithButton";
