import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/keys";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";
import { DateUtils, getTodayInSaoPaulo } from "@/utils/date";

import { ReadingRecapService } from "../services";
import type { RecapFilter, RecapPeriodKind } from "../types";
import {
  applyRecapAnchorDate,
  applyRecapPeriodKind,
  createDefaultRecapFilter,
  formatRecapPeriodTitle,
  paginateRecapImages,
  recapPeriodToDate,
  renderRecapImageToPng,
  selectRecapBooks,
  toRecapDownloadFilename,
  triggerPngDownload,
} from "../utils";
import { useLoadableRecapBooks } from "./useLoadableRecapBooks";

const readingRecapService = new ReadingRecapService();

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function useReadingRecap(isOpen: boolean) {
  const isLoggedIn = useIsLoggedIn();
  const userId = useUserStore((state) => state.user?.id);
  const [filter, setFilter] = useState<RecapFilter>(() =>
    createDefaultRecapFilter(),
  );
  const [imageIndex, setImageIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenderFilterEnabled, setIsGenderFilterEnabled] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [excludedBookIds, setExcludedBookIds] = useState<string[]>([]);

  useEffect(() => {
    setFilter(createDefaultRecapFilter());
    setImageIndex(0);
    setIsDownloading(false);
    setIsGenderFilterEnabled(false);
    setHasRevealed(false);
    setExcludedBookIds([]);
  }, [isOpen]);

  const queryEnabled = isOpen && isLoggedIn && Boolean(userId);

  const finishedQuery = useQuery({
    queryKey: QUERY_KEYS.readingRecap.finished(userId ?? ""),
    queryFn: () => readingRecapService.getFinishedBooks(userId!),
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
  });

  const selectedBooks = useMemo(
    () => selectRecapBooks(finishedQuery.data ?? [], filter),
    [filter, finishedQuery.data],
  );
  const { isProbing } = useLoadableRecapBooks(selectedBooks);
  const visibleBooks = useMemo(
    () =>
      selectedBooks.filter((book) => !excludedBookIds.includes(book.id)),
    [excludedBookIds, selectedBooks],
  );
  const images = useMemo(
    () => paginateRecapImages(visibleBooks, filter),
    [filter, visibleBooks],
  );

  useEffect(() => {
    setImageIndex((current) => {
      if (images.length === 0) return 0;
      return current >= images.length ? 0 : current;
    });
  }, [images.length]);

  const currentImage = images[imageIndex] ?? null;
  const isQueryPending = finishedQuery.isPending;
  const isContentPending = isQueryPending || isProbing;
  const isLoading = isContentPending;
  const isShellPending = Boolean(isOpen && !hasRevealed && isContentPending);
  const isEmpty = !isLoading && images.length === 0;
  const canDownload = !isEmpty && !isDownloading && !isLoading;
  const coverCount = visibleBooks.length;
  const countLabel = useMemo(() => {
    if (isLoading || coverCount === 0) return null;
    const covers = coverCount === 1 ? "1 capa" : `${coverCount} capas`;
    if (images.length <= 1) return `${covers} neste recap`;
    return `${covers} · ${images.length} imagens`;
  }, [coverCount, images.length, isLoading]);
  const emptyCaption = useMemo(() => {
    if (!isEmpty) return null;
    if (selectedBooks.length > 0) {
      return "Você removeu todas as capas. Feche e abra de novo para restaurá-las.";
    }
    return "Nenhuma leitura finalizada neste período. Troque o ano, o mês ou o dia.";
  }, [isEmpty, selectedBooks.length]);

  useEffect(() => {
    if (isOpen && !isContentPending) {
      setHasRevealed(true);
    }
  }, [isOpen, isContentPending]);
  const periodTitle = useMemo(
    () => formatRecapPeriodTitle(filter.period),
    [filter.period],
  );
  const anchorDate = useMemo(
    () => recapPeriodToDate(filter.period),
    [filter.period],
  );
  const yearOptions = useMemo(() => {
    const currentYear = getTodayInSaoPaulo().getFullYear();
    const years = new Set<number>([currentYear, filter.period.year]);
    for (let year = currentYear; year >= currentYear - 20; year -= 1) {
      years.add(year);
    }
    for (const book of finishedQuery.data ?? []) {
      const endDate = DateUtils.toDate(book.endDate);
      if (endDate) years.add(endDate.getFullYear());
    }
    return [...years].sort((left, right) => right - left);
  }, [filter.period.year, finishedQuery.data]);
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const date = DateUtils.createLocalDate(2026, month, 1);
        return {
          value: String(month),
          label: new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
            date,
          ),
        };
      }),
    [],
  );

  const handlePeriodKindChange = useCallback((kind: RecapPeriodKind) => {
    setFilter((current) => applyRecapPeriodKind(current, kind));
    setImageIndex(0);
  }, []);

  const handleAnchorDateChange = useCallback((date: Date | undefined) => {
    if (!date) return;
    setFilter((current) => applyRecapAnchorDate(current, date));
    setImageIndex(0);
  }, []);

  const handleMonthChange = useCallback((monthValue: string) => {
    const month = Number(monthValue);
    setFilter((current) => {
      const year = current.period.year;
      const day = Math.min(current.period.day ?? 1, daysInMonth(year, month));
      return applyRecapAnchorDate(
        current,
        DateUtils.createLocalDate(year, month, day),
      );
    });
    setImageIndex(0);
  }, []);

  const handleYearChange = useCallback((yearValue: string) => {
    const year = Number(yearValue);
    setFilter((current) => {
      const month = current.period.month ?? 1;
      const day = Math.min(current.period.day ?? 1, daysInMonth(year, month));
      return applyRecapAnchorDate(
        current,
        DateUtils.createLocalDate(year, month, day),
      );
    });
    setImageIndex(0);
  }, []);

  const handleToggleGender = useCallback((gender: string) => {
    setFilter((current) => {
      const selected = current.genders.includes(gender)
        ? current.genders.filter((item) => item !== gender)
        : [...current.genders, gender];
      return { ...current, genders: selected };
    });
    setImageIndex(0);
  }, []);

  const handleGenderFilterEnabledChange = useCallback((enabled: boolean) => {
    setIsGenderFilterEnabled(enabled);
    if (enabled) return;
    setFilter((current) =>
      current.genders.length === 0 ? current : { ...current, genders: [] },
    );
    setImageIndex(0);
  }, []);

  const handlePreviousImage = useCallback(() => {
    setImageIndex((current) => Math.max(0, current - 1));
  }, []);

  const handleNextImage = useCallback(() => {
    setImageIndex((current) =>
      images.length === 0 ? 0 : Math.min(images.length - 1, current + 1),
    );
  }, [images.length]);

  const handleSelectImage = useCallback(
    (index: number) => {
      setImageIndex(() => {
        if (images.length === 0) return 0;
        return Math.min(Math.max(index, 0), images.length - 1);
      });
    },
    [images.length],
  );

  const handleRemoveBook = useCallback((bookId: string) => {
    setExcludedBookIds((current) =>
      current.includes(bookId) ? current : [...current, bookId],
    );
  }, []);

  const downloadImages = useCallback(
    async (targets: typeof images) => {
      if (targets.length === 0) return;
      setIsDownloading(true);
      try {
        const files = await Promise.all(
          targets.map(async (image) => ({
            blob: await renderRecapImageToPng(image),
            filename: toRecapDownloadFilename(image.title),
          })),
        );
        for (const file of files) {
          triggerPngDownload(file.blob, file.filename);
        }
      } catch {
        toast.error("Não foi possível gerar a imagem. Tente de novo.");
      } finally {
        setIsDownloading(false);
      }
    },
    [],
  );

  const downloadCurrent = useCallback(async () => {
    if (!currentImage) return;
    await downloadImages([currentImage]);
  }, [currentImage, downloadImages]);

  const downloadAll = useCallback(async () => {
    await downloadImages(images);
  }, [downloadImages, images]);

  return {
    filter,
    images,
    currentImage,
    imageIndex,
    isEmpty,
    canDownload,
    isDownloading,
    isLoading,
    isProbing,
    isShellPending,
    isGenderFilterEnabled,
    isError: finishedQuery.isError,
    periodTitle,
    countLabel,
    emptyCaption,
    handleRemoveBook,
    anchorDate,
    yearOptions,
    monthOptions,
    handlePeriodKindChange,
    handleAnchorDateChange,
    handleMonthChange,
    handleYearChange,
    handleToggleGender,
    handleGenderFilterEnabledChange,
    handlePreviousImage,
    handleNextImage,
    handleSelectImage,
    downloadCurrent,
    downloadAll,
  };
}

export default useReadingRecap;
