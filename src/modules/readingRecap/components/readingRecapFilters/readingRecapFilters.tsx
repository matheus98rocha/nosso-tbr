"use client";

import { ChevronDown, Tags } from "lucide-react";

import { DatePicker } from "@/components/datePicker";
import { SelectField } from "@/components/selectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { genders } from "@/constants/genders";
import { cn } from "@/lib/utils";

import type { ReadingRecapFiltersProps } from "../../types";

const PERIOD_KIND_OPTIONS = [
  { kind: "year" as const, label: "Ano" },
  { kind: "month" as const, label: "Mês" },
  { kind: "day" as const, label: "Dia" },
];

function ReadingRecapFilters({
  filter,
  anchorDate,
  monthOptions,
  yearOptions,
  isGenderFilterEnabled,
  onPeriodKindChange,
  onAnchorDateChange,
  onMonthChange,
  onYearChange,
  onToggleGender,
  onGenderFilterEnabledChange,
}: ReadingRecapFiltersProps) {
  const selectedGenderCount = filter.genders.length;

  return (
    <div className="flex flex-col gap-3">
      <fieldset>
        <legend className="sr-only">Quando você leu</legend>
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
                  "h-8 cursor-pointer rounded-full px-4 text-xs font-medium",
                  isActive
                    ? "border-[#5B4BDB] bg-[#5B4BDB] text-white hover:bg-[#4C3EC4] hover:text-white"
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

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={isGenderFilterEnabled}
        aria-controls="recap-gender-filters"
        aria-label={
          selectedGenderCount === 0
            ? "Filtrar por gênero"
            : selectedGenderCount === 1
              ? "Filtrar por gênero, 1 selecionado"
              : `Filtrar por gênero, ${selectedGenderCount} selecionados`
        }
        onClick={() => onGenderFilterEnabledChange(!isGenderFilterEnabled)}
        className="h-8 w-fit cursor-pointer gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Tags className="size-3.5" aria-hidden />
        Filtrar por gênero
        {selectedGenderCount > 0 ? (
          <Badge
            variant="secondary"
            aria-hidden
            className="h-5 min-w-5 px-1.5 text-[10px]"
          >
            {selectedGenderCount}
          </Badge>
        ) : null}
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200",
            isGenderFilterEnabled && "rotate-180",
          )}
          aria-hidden
        />
      </Button>

      {isGenderFilterEnabled ? (
        <fieldset id="recap-gender-filters">
          <legend className="sr-only">Gênero</legend>
          <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
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
                    "h-7 cursor-pointer rounded-full px-3 text-[11px] font-medium",
                    isActive
                      ? "border-[#5B4BDB] bg-[#5B4BDB] text-white hover:bg-[#4C3EC4] hover:text-white"
                      : "text-zinc-500",
                  )}
                >
                  {gender.label}
                </Button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}

export default ReadingRecapFilters;
