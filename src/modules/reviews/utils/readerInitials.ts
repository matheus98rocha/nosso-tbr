export function readerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => Array.from(part)[0]?.toUpperCase() ?? "");
  return letters.join("") || "L";
}
