"use client";

import { ChevronLeft, ChevronRight, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useReadingRecap } from "../../hooks";
import type { ReadingRecapModalProps } from "../../types";
import ReadingRecapFilters from "../readingRecapFilters";
import ReadingRecapPreview from "../readingRecapPreview";

function ReadingRecapModal({ isOpen, onOpenChange }: ReadingRecapModalProps) {
  const recap = useReadingRecap(isOpen);
  const hasManyImages = recap.images.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Recap de leitura</DialogTitle>
          <DialogDescription>
            Gere imagens 9:16 com as capas dos livros que você finalizou. O app
            só cria o arquivo; você escolhe onde postar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <ReadingRecapFilters
            filter={recap.filter}
            anchorDate={recap.anchorDate}
            monthOptions={recap.monthOptions}
            yearOptions={recap.yearOptions}
            onPeriodKindChange={recap.handlePeriodKindChange}
            onAnchorDateChange={recap.handleAnchorDateChange}
            onMonthChange={recap.handleMonthChange}
            onYearChange={recap.handleYearChange}
            onToggleGender={recap.handleToggleGender}
          />

          <div className="flex flex-col items-center gap-3">
            <ReadingRecapPreview
              image={recap.currentImage}
              periodTitle={recap.periodTitle}
              isEmpty={recap.isEmpty}
              isLoading={recap.isLoading}
              isError={recap.isError}
            />
            {hasManyImages ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Imagem anterior do recap"
                  onClick={recap.handlePreviousImage}
                  disabled={recap.imageIndex === 0}
                >
                  <ChevronLeft />
                </Button>
                <p className="min-w-12 text-center text-xs text-muted-foreground">
                  {recap.imageIndex + 1}/{recap.images.length}
                </p>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Próxima imagem do recap"
                  onClick={recap.handleNextImage}
                  disabled={recap.imageIndex >= recap.images.length - 1}
                >
                  <ChevronRight />
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          {hasManyImages ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void recap.downloadAll()}
              disabled={!recap.canDownload}
            >
              <Download />
              {recap.isDownloading ? "Baixando..." : "Baixar todas"}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => void recap.downloadCurrent()}
            disabled={!recap.canDownload}
          >
            <Download />
            {recap.isDownloading ? "Baixando..." : "Baixar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReadingRecapModal;
