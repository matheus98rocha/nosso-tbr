"use client";

import { DatePicker } from "@/components/datePicker";
import { SelectField } from "@/components/selectField";
import { Button } from "@/components/ui/button";
import { genders } from "@/constants/genders";
import { cn } from "@/lib/utils";

import type { ReadingRecapFiltersProps } from "../../types";

const PERIOD_KIND_OPTIONS = [
  { kind: "day" as const, label: "Dia" },
  { kind: "month" as const, label: "Mês" },
  { kind: "year" as const, label: "Ano" },
];

function ReadingRecapFilters({
  filter,
  anchorDate,
  monthOptions,
  yearOptions,
  onPeriodKindChange,
  onAnchorDateChange,
  onMonthChange,
  onYearChange,
  onToggleGender,
}: ReadingRecapFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Período
        </legend>
        <div className="flex flex-wrap gap-2">
          {PERIOD_KIND_OPTIONS.map((option) => {
            const isActive = filter.period.kind === option.kind;
            return (
              <Button
                key={option.kind}
                type="button"
                size="sm"
                variant="outline"
                aria-pressed={isActive}
                onClick={() => onPeriodKindChange(option.kind)}
                className={cn(
                  "rounded-full h-8 px-4 text-xs font-medium",
                  isActive
                    ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                    : "text-zinc-500",
                )}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </fieldset>

      {filter.period.kind === "day" ? (
        <DatePicker value={anchorDate} onChange={onAnchorDateChange} />
      ) : null}

      {filter.period.kind === "month" ? (
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            name="recap-month"
            placeholder="Mês"
            value={String(filter.period.month ?? 1)}
            onChange={onMonthChange}
            items={monthOptions}
          />
          <SelectField
            name="recap-year"
            placeholder="Ano"
            value={String(filter.period.year)}
            onChange={onYearChange}
            items={yearOptions.map((year) => ({
              value: String(year),
              label: String(year),
            }))}
          />
        </div>
      ) : null}

      {filter.period.kind === "year" ? (
        <SelectField
          name="recap-year-only"
          placeholder="Ano"
          value={String(filter.period.year)}
          onChange={onYearChange}
          items={yearOptions.map((year) => ({
            value: String(year),
            label: String(year),
          }))}
        />
      ) : null}

      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Gênero
        </legend>
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
          {genders.map((gender) => {
            const isActive = filter.genders.includes(gender.value);
            return (
              <Button
                key={gender.value}
                type="button"
                size="sm"
                variant="outline"
                aria-pressed={isActive}
                onClick={() => onToggleGender(gender.value)}
                className={cn(
                  "rounded-full h-7 px-3 text-[11px] font-medium",
                  isActive
                    ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                    : "text-zinc-500",
                )}
              >
                {gender.label}
              </Button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

export default ReadingRecapFilters;
