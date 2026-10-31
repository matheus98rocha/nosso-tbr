function lin(channel: number): number {
  if (channel <= 0.04045) return channel / 12.92;
  return ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(
  red: number,
  green: number,
  blue: number,
): number {
  return 0.2126 * lin(red) + 0.7152 * lin(green) + 0.0722 * lin(blue);
}
