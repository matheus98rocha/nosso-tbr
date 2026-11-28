export function normalizeFocusBookPage(
  value: number,
  totalPages: number,
): number | null {
  if (
    !Number.isInteger(totalPages) ||
    totalPages <= 0 ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > totalPages
  ) {
    return null;
  }

  return value;
}

export function computeFocusPageRange(
  currentPage: number,
  targetPage: number,
  totalPages: number,
): number | null {
  const current = normalizeFocusBookPage(currentPage, totalPages);
  const target = normalizeFocusBookPage(targetPage, totalPages);

  if (current === null || target === null || target <= current) return null;

  return target - current;
}
