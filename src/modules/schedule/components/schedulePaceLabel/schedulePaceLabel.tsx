"use client";

import { CalendarDays } from "lucide-react";
import { memo } from "react";

import { useSchedulePaceLabel } from "./hooks/useSchedulePaceLabel";
import type { SchedulePaceLabelProps } from "./types/schedulePaceLabel.types";

function SchedulePaceLabelComponent({
  pace,
  variant,
  className,
}: SchedulePaceLabelProps) {
  const {
    shouldRender,
    labels,
    isCard,
    dateTime,
    shortCaption,
    showStatusChip,
    rootClassName,
    iconWellClassName,
    iconClassName,
    captionClassName,
    shortCaptionClassName,
    dateClassName,
    chipClassName,
    delayClassName,
  } = useSchedulePaceLabel({ pace, variant, className });

  if (!shouldRender || !labels) {
    return null;
  }

  if (isCard) {
    return (
      <div
        className={rootClassName}
        role="status"
        aria-label={labels.ariaLabel}
      >
        <p className={shortCaptionClassName}>{shortCaption}</p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <CalendarDays className={iconClassName} aria-hidden />
          <time className={dateClassName} dateTime={dateTime}>
            {labels.dateText}
          </time>
          {showStatusChip ? (
            <span className={chipClassName}>{labels.statusLabel}</span>
          ) : null}
        </div>
        {labels.delay ? (
          <p className={delayClassName}>{labels.delay}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={rootClassName} role="status" aria-label={labels.ariaLabel}>
      <span className={iconWellClassName} aria-hidden>
        <CalendarDays className={iconClassName} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={captionClassName}>{labels.caption}</p>
          {showStatusChip ? (
            <span className={chipClassName}>{labels.statusLabel}</span>
          ) : null}
        </div>
        <time className={dateClassName} dateTime={dateTime}>
          {labels.dateText}
        </time>
        {labels.delay ? (
          <p className={delayClassName}>{labels.delay}</p>
        ) : null}
      </div>
    </div>
  );
}

export const SchedulePaceLabel = memo(SchedulePaceLabelComponent);

export default SchedulePaceLabel;
