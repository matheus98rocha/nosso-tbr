"use client";

import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";

import { FINISHED_BOOK_SHARE_COPY } from "../../constants";
import { openNow } from "../../stores";
import type { ShareFinishedBookOnXButtonProps } from "../../types";
import { buildFinishedBookShareSubject } from "../../utils/buildShareModel";

export function ShareFinishedBookOnXButton({
  bookId,
  title,
  author,
  imageUrl,
}: ShareFinishedBookOnXButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    openNow(
      buildFinishedBookShareSubject({
        bookId,
        title,
        author,
        imageUrl,
      }),
    );
  };

  return (
    <Button type="button" className="w-full" onClick={handleClick}>
      {FINISHED_BOOK_SHARE_COPY.dialogTitle}
    </Button>
  );
}
