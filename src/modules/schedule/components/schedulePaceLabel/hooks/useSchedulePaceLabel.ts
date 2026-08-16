import { useMemo } from "react";

import { cn } from "@/lib/utils";

import { formatSchedulePaceLabels } from "../../../utils/formatSchedulePaceLabels";
import type {
  SchedulePaceLabelProps,
  SchedulePaceLabelViewModel,
} from "../types/schedulePaceLabel.types";

export function useSchedulePaceLabel({
  pace,
  variant,
  className,
}: SchedulePaceLabelProps): SchedulePaceLabelViewModel {
  const isCard = variant === "card";
  const status = pace?.status ?? null;

  const labels = useMemo(
    () => (pace ? formatSchedulePaceLabels(pace) : null),
    [pace],
  );

  const dateTime = useMemo(() => {
    if (!pace) {
      return "";
    }

    const year = pace.predictedEndDate.getFullYear();
    const month = String(pace.predictedEndDate.getMonth() + 1).padStart(2, "0");
    const day = String(pace.predictedEndDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [pace]);

  const showStatusChip = useMemo(() => {
    if (!status) {
      return false;
    }

    if (isCard) {
      return status === "ahead";
    }

    return true;
  }, [isCard, status]);

  const toneClassName = useMemo(() => {
    if (status === "behind") {
      return {
        root: isCard
          ? "mt-1.5 w-full"
          : cn(
              "rounded-2xl border border-amber-900/15 bg-linear-to-br from-amber-50/90 via-background to-orange-50/40 p-4 shadow-sm shadow-amber-900/5",
              "dark:border-amber-400/20 dark:from-amber-950/40 dark:via-card dark:to-orange-950/20 dark:shadow-black/20",
            ),
        well: cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800",
          "dark:bg-amber-950/70 dark:text-amber-300",
        ),
        date: isCard
          ? "text-xs font-semibold tabular-nums tracking-tight text-amber-800 dark:text-amber-300"
          : "text-lg font-semibold tabular-nums tracking-tight text-amber-900 dark:text-amber-200",
        chip: cn(
          "inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900",
          "dark:bg-amber-950/80 dark:text-amber-300",
        ),
        delay: isCard
          ? "text-[11px] font-medium text-amber-800 dark:text-amber-300"
          : "mt-1 text-sm font-medium text-amber-800 dark:text-amber-300",
      };
    }

    if (status === "ahead") {
      return {
        root: isCard
          ? "mt-1.5 w-full"
          : cn(
              "rounded-2xl border border-teal-900/10 bg-linear-to-br from-teal-50/90 via-background to-sky-50/40 p-4 shadow-sm shadow-teal-900/5",
              "dark:border-teal-400/15 dark:from-teal-950/35 dark:via-card dark:to-sky-950/20 dark:shadow-black/20",
            ),
        well: cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800",
          "dark:bg-teal-950/70 dark:text-teal-300",
        ),
        date: isCard
          ? "text-xs font-semibold tabular-nums tracking-tight text-teal-800 dark:text-teal-300"
          : "text-lg font-semibold tabular-nums tracking-tight text-teal-900 dark:text-teal-200",
        chip: cn(
          "inline-flex shrink-0 items-center rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800",
          "dark:bg-teal-950/80 dark:text-teal-300",
        ),
        delay: "",
      };
    }

    return {
      root: isCard
        ? "mt-1.5 w-full"
        : cn(
            "rounded-2xl border border-emerald-900/10 bg-linear-to-br from-emerald-50/80 via-background to-teal-50/40 p-4 shadow-sm shadow-emerald-900/5",
            "dark:border-emerald-400/15 dark:from-emerald-950/30 dark:via-card dark:to-teal-950/20 dark:shadow-black/20",
          ),
      well: cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800",
        "dark:bg-emerald-950/70 dark:text-emerald-300",
      ),
      date: isCard
        ? "text-xs font-semibold tabular-nums tracking-tight text-emerald-800 dark:text-emerald-300"
        : "text-lg font-semibold tabular-nums tracking-tight text-emerald-900 dark:text-emerald-200",
      chip: cn(
        "inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800",
        "dark:bg-emerald-950/80 dark:text-emerald-300",
      ),
      delay: "",
    };
  }, [isCard, status]);

  const rootClassName = useMemo(
    () =>
      cn(
        isCard
          ? "flex flex-col items-center gap-0.5 text-center"
          : "flex w-full items-start gap-3",
        toneClassName.root,
        className,
      ),
    [className, isCard, toneClassName.root],
  );

  const iconWellClassName = useMemo(
    () => toneClassName.well,
    [toneClassName.well],
  );

  const iconClassName = useMemo(
    () => (isCard ? "size-3.5 shrink-0" : "size-5"),
    [isCard],
  );

  const captionClassName = useMemo(
    () => "text-xs font-medium leading-snug text-muted-foreground",
    [],
  );

  const shortCaptionClassName = useMemo(
    () => "text-[10px] font-medium tracking-wide text-muted-foreground",
    [],
  );

  const dateClassName = useMemo(() => toneClassName.date, [toneClassName.date]);

  const chipClassName = useMemo(() => toneClassName.chip, [toneClassName.chip]);

  const delayClassName = useMemo(
    () => toneClassName.delay,
    [toneClassName.delay],
  );

  return useMemo(
    () => ({
      shouldRender: Boolean(pace && labels),
      labels,
      isCard,
      status,
      dateTime,
      shortCaption: "Término",
      showStatusChip,
      rootClassName,
      iconWellClassName,
      iconClassName,
      captionClassName,
      shortCaptionClassName,
      dateClassName,
      chipClassName,
      delayClassName,
    }),
    [
      captionClassName,
      chipClassName,
      dateClassName,
      dateTime,
      delayClassName,
      iconClassName,
      iconWellClassName,
      isCard,
      labels,
      pace,
      rootClassName,
      shortCaptionClassName,
      showStatusChip,
      status,
    ],
  );
}

export default useSchedulePaceLabel;
