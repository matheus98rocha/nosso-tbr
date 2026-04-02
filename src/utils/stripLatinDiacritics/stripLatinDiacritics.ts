export function stripLatinDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}
