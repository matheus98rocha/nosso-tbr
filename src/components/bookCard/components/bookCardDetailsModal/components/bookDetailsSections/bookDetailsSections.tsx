"use client";

import {
  Ban,
  BookMarked,
  BookPlus,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Heart,
  Library,
  Lock,
  MessageSquareQuote,
  PauseCircle,
  Pencil,
  PlayCircle,
  Search,
  Share2,
  Star,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { BookCover } from "@/components/bookCover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { getGenderLabel, getGenreBadgeColor } from "@/constants/genders";
import { cn } from "@/lib/utils";

import type {
  BookDetailsActionIcon,
  BookDetailsCommandButtonProps,
  BookDetailsCommandGridProps,
  BookDetailsFooterProps,
  BookDetailsHeroProps,
  BookDetailsInsightsProps,
  BookDetailsPrimaryTone,
  BookDetailsReadersProps,
  BookDetailsTimelineProps,
} from "../../types/bookCardDetailsModal.types";

const actionIcons: Record<BookDetailsActionIcon, typeof CalendarDays> = {
  calendar: CalendarDays,
  quotes: MessageSquareQuote,
  search: Search,
  collective: BookMarked,
  copy: Copy,
  share: Share2,
  shelf: Library,
  edit: Pencil,
  favorite: Heart,
  pause: PauseCircle,
  abandon: Ban,
  play: PlayCircle,
  check: Check,
  library: BookPlus,
  finish: CheckCircle2,
  trash: Trash2,
  reader: UserPlus,
};

const primaryToneClassName: Record<BookDetailsPrimaryTone, string> = {
  start:
    "bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500",
  finish:
    "bg-[var(--reading-ink)] text-[var(--reading-surface)] hover:opacity-90",
  library:
    "bg-violet-700 text-white hover:bg-violet-800 dark:bg-violet-500 dark:hover:bg-violet-400",
};

export function BookDetailsHero({
  book,
  statusDisplay,
  isOwnSoloBook,
  ratingStars,
}: BookDetailsHeroProps) {
  return (
    <header className="border-b border-[color-mix(in_oklch,var(--reading-ink)_10%,transparent)] bg-[var(--reading-surface)] px-5 pt-12 pb-5">
      <div className="flex items-stretch gap-4">
        <BookCover
          src={book.image_url}
          alt=""
          width={112}
          height={168}
          priority
          containerClassName="shrink-0 rounded-md shadow-md ring-1 ring-black/10"
        />
        <div className="flex min-h-[168px] min-w-0 flex-1 flex-col justify-between gap-2 pr-6">
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-[color-mix(in_oklch,var(--reading-ink)_55%,transparent)] uppercase">
              Ficha de leitura
            </p>
            {statusDisplay ? (
              <span
                className={cn(
                  "inline-flex w-fit max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  statusDisplay.colorClass,
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    statusDisplay.dotClass,
                  )}
                />
                <span className="truncate">{statusDisplay.label}</span>
              </span>
            ) : null}
          </div>
          <DialogTitle className="brand-display text-balance text-xl leading-tight font-semibold tracking-tight text-[var(--reading-ink)] sm:text-2xl">
            {book.title}
          </DialogTitle>
          <div className="flex flex-col gap-2">
            <DialogDescription className="text-sm text-pretty text-[color-mix(in_oklch,var(--reading-ink)_72%,transparent)]">
              {book.author}
            </DialogDescription>
            {ratingStars !== null ? (
              <p
                className="flex items-center gap-1 text-amber-700 dark:text-amber-300"
                aria-label={`Nota ${ratingStars} de 5`}
              >
                {Array.from({ length: 5 }, (_, index) => {
                  const filled = index < ratingStars;
                  return (
                    <Star
                      key={index}
                      aria-hidden
                      className={cn(
                        "size-3.5",
                        filled ? "fill-current" : "opacity-30",
                      )}
                    />
                  );
                })}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
            {isOwnSoloBook ? (
              <Badge
                variant="secondary"
                aria-label="Livro privado — visível apenas para você"
                className="w-fit gap-1 border-none bg-[color-mix(in_oklch,var(--reading-ink)_8%,transparent)] font-medium text-[var(--reading-ink)] uppercase"
              >
                <Lock aria-hidden className="size-2.5" />
                Privado
              </Badge>
            ) : null}
            {book.is_favorite ? (
              <Badge
                variant="secondary"
                className="w-fit gap-1 border-none bg-rose-100 font-medium text-rose-700 uppercase dark:bg-rose-950/50 dark:text-rose-300"
              >
                <Heart aria-hidden className="size-2.5 fill-current" />
                Favorito
              </Badge>
            ) : null}
            {book.is_reread ? (
              <Badge
                variant="secondary"
                className="w-fit border-none bg-violet-100 font-medium text-violet-700 uppercase dark:bg-violet-900/30 dark:text-violet-300"
              >
                Releitura
              </Badge>
            ) : null}
            {book.gender ? (
              <Badge
                variant="secondary"
                className={cn(
                  "w-fit border-none font-medium uppercase",
                  getGenreBadgeColor(book.gender),
                )}
              >
                {getGenderLabel(book.gender)}
              </Badge>
            ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function BookDetailsInsights({ insights }: BookDetailsInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-2 [&>*:last-child:nth-child(odd)]:col-span-2">
      {insights.map((insight) => (
        <div
          key={insight.id}
          className="rounded-2xl border border-[color-mix(in_oklch,var(--reading-ink)_10%,transparent)] bg-[color-mix(in_oklch,var(--reading-surface)_72%,var(--card))] px-3.5 py-3"
        >
          <dt className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {insight.label}
          </dt>
          <dd className="brand-display mt-1.5 text-[1.65rem] leading-none font-semibold tracking-tight text-[var(--reading-ink)] tabular-nums">
            {insight.value}
          </dd>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{insight.hint}</p>
        </div>
      ))}
    </dl>
  );
}

export function BookDetailsTimeline({ items }: BookDetailsTimelineProps) {
  if (items.length === 0) return null;

  return (
    <ol className="space-y-0">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3 pb-3 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className="absolute top-3 bottom-0 left-[5px] w-px bg-[color-mix(in_oklch,var(--reading-ink)_16%,transparent)]"
              />
            ) : null}
            <span
              aria-hidden
              className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-[var(--reading-ink)] bg-[var(--reading-surface)]"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {item.label}
              </p>
              <p className="text-sm font-medium text-foreground">{item.value}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function BookDetailsReaders({ readers }: BookDetailsReadersProps) {
  if (readers.length === 0) return null;

  return (
    <section aria-label="Leitores" className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        <Users aria-hidden className="size-3.5" />
        Leitores
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {readers.map((reader) => (
          <li
            key={reader}
            className="rounded-full border border-[color-mix(in_oklch,var(--reading-ink)_12%,transparent)] bg-background px-2.5 py-1 text-xs font-medium text-foreground"
          >
            {reader}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CommandButton({ command }: BookDetailsCommandButtonProps) {
  const Icon = actionIcons[command.icon];
  const favoriteActive = command.id === "favorite" && command.pressed;
  const danger = Boolean(command.danger);

  return (
    <button
      type="button"
      disabled={command.disabled}
      title={command.title}
      aria-pressed={command.pressed}
      onClick={command.onSelect}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        favoriteActive || danger
          ? "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50"
          : "border-[color-mix(in_oklch,var(--reading-ink)_10%,transparent)] bg-card hover:bg-accent/70",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          favoriteActive || danger
            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200"
            : "bg-[color-mix(in_oklch,var(--reading-ink)_6%,transparent)] text-[var(--reading-ink)]",
        )}
      >
        <Icon
          aria-hidden
          className={cn("size-4", favoriteActive && "fill-current")}
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{command.label}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {command.hint}
        </span>
      </span>
    </button>
  );
}

export function BookDetailsCommandGrid({
  commands,
}: BookDetailsCommandGridProps) {
  if (commands.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 min-[380px]:[&>*:last-child:nth-child(odd)]:col-span-2">
      {commands.map((command) => (
        <CommandButton key={command.id} command={command} />
      ))}
    </div>
  );
}

export function BookDetailsFooter({
  primary,
  secondary,
}: BookDetailsFooterProps) {
  if (!primary && secondary.length === 0) return null;

  const PrimaryIcon = primary ? actionIcons[primary.icon] : null;

  return (
    <div className="z-10 flex shrink-0 flex-col gap-2 border-t border-[color-mix(in_oklch,var(--reading-ink)_10%,transparent)] bg-[color-mix(in_oklch,var(--background)_94%,transparent)] px-5 py-4 backdrop-blur-md">
      {primary && PrimaryIcon ? (
        <Button
          type="button"
          disabled={primary.disabled}
          onClick={primary.onSelect}
          className={cn(
            "h-11 w-full cursor-pointer gap-2 rounded-xl text-sm font-semibold",
            primaryToneClassName[primary.tone],
          )}
        >
          <PrimaryIcon aria-hidden className="size-4" />
          {primary.label}
        </Button>
      ) : null}
      {secondary.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {secondary.map((command) => {
            const Icon = actionIcons[command.icon];
            const isAbandon = command.id === "abandon";
            return (
              <Button
                key={command.id}
                type="button"
                variant="outline"
                disabled={command.disabled}
                onClick={command.onSelect}
                className={cn(
                  "h-auto min-h-10 cursor-pointer gap-1.5 rounded-xl px-2 whitespace-normal",
                  isAbandon &&
                    "text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40",
                )}
              >
                <Icon aria-hidden className="size-3.5" />
                {command.label}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
