export type ReadingRatingStarsRowProps = {
  displayValue: number | null;
  disabled?: boolean;
  onPick: (stars: number) => void;
  ariaOwnsSuffix?: string;
};
