"use client";

import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks";

import ReadingRecapModal from "../readingRecapModal";

function ReadingRecap() {
  const modal = useModal();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={modal.open}
        className="rounded-full h-8 gap-1.5 px-3 text-xs font-medium"
      >
        <Share2 className="size-3.5" aria-hidden />
        Compartilhar leituras
      </Button>
      <ReadingRecapModal isOpen={modal.isOpen} onOpenChange={modal.setIsOpen} />
    </>
  );
}

export default ReadingRecap;
