"use client";

import { Images } from "lucide-react";

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
        aria-label="Abrir recap de leitura"
        className="rounded-full h-8 gap-1.5 px-3 text-xs font-medium"
      >
        <Images className="size-3.5" aria-hidden />
        Recap de leitura
      </Button>
      <ReadingRecapModal isOpen={modal.isOpen} onOpenChange={modal.setIsOpen} />
    </>
  );
}

export default ReadingRecap;
