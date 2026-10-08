"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { useReadingRecap } from "../../hooks";
import type { ReadingRecapModalProps } from "../../types";
import ReadingRecapFilters from "../readingRecapFilters";
import ReadingRecapPreview from "../readingRecapPreview";
import ReadingRecapModalSkeleton from "./readingRecapModalSkeleton";

function ReadingRecapModal({ isOpen, onOpenChange }: ReadingRecapModalProps) {
  const recap = useReadingRecap(isOpen);
  const hasManyImages = recap.images.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        aria-busy={recap.isShellPending || recap.isLoading}
        className="max-h-[90dvh] gap-5 overflow-y-auto rounded-2xl border-border/70 bg-[var(--reading-surface)] p-5 sm:max-w-lg sm:p-6"
      >
        <DialogHeader className="gap-1.5 sm:text-left">
          <DialogTitle className="brand-display text-2xl font-semibold tracking-tight text-[var(--reading-ink)]">
            Compartilhar leituras
          </DialogTitle>
          <DialogDescription>
            As capas das suas leituras, em imagens prontas para baixar e postar
            onde você quiser.
          </DialogDescription>
        </DialogHeader>

        {recap.isShellPending ? (
          <>
            <ReadingRecapModalSkeleton />
            <DialogFooter>
              <Skeleton className="h-9 w-full rounded-md sm:w-24" />
              <Skeleton className="h-9 w-full rounded-md sm:w-28" />
            </DialogFooter>
          </>
        ) : (
          <>
            <ReadingRecapFilters
              filter={recap.filter}
              anchorDate={recap.anchorDate}
              monthOptions={recap.monthOptions}
              yearOptions={recap.yearOptions}
              isGenderFilterEnabled={recap.isGenderFilterEnabled}
              onPeriodKindChange={recap.handlePeriodKindChange}
              onAnchorDateChange={recap.handleAnchorDateChange}
              onMonthChange={recap.handleMonthChange}
              onYearChange={recap.handleYearChange}
              onToggleGender={recap.handleToggleGender}
              onGenderFilterEnabledChange={recap.handleGenderFilterEnabledChange}
            />

            {recap.countLabel ? (
              <p className="text-center text-xs font-medium text-muted-foreground">
                {recap.countLabel}
              </p>
            ) : null}

            <div className="flex flex-col items-center gap-3">
              <ReadingRecapPreview
                image={recap.currentImage}
                periodTitle={recap.periodTitle}
                isEmpty={recap.isEmpty}
                isLoading={recap.isLoading}
                isError={recap.isError}
                imageCount={recap.images.length}
                imageIndex={recap.imageIndex}
                onPrevious={recap.handlePreviousImage}
                onNext={recap.handleNextImage}
                onSelectImage={recap.handleSelectImage}
                onCoverError={recap.markCoverFailed}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              {hasManyImages ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => void recap.downloadAll()}
                  disabled={!recap.canDownload}
                >
                  <Download />
                  {recap.isDownloading ? "Baixando..." : "Baixar todas"}
                </Button>
              ) : null}
              <Button
                type="button"
                className="cursor-pointer"
                onClick={() => void recap.downloadCurrent()}
                disabled={!recap.canDownload}
              >
                <Download />
                {recap.isDownloading ? "Baixando..." : "Baixar"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ReadingRecapModal;
