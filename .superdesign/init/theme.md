# Theme summary

- Font: Geist Sans for UI, Newsreader via `--font-auth-display` for `.brand-display`.
- Light palette: background/card/popover white; foreground `oklch(0.13 0.028 261.692)`; primary `oklch(0.21 0.034 264.665)`; secondary/muted/accent `oklch(0.967 0.003 264.542)`; border/input `oklch(0.928 0.006 264.531)`; ring `oklch(0.707 0.022 261.325)`.
- Dark palette: background `oklch(0.13 0.028 261.692)`; card/popover `oklch(0.21 0.034 264.665)`; primary `oklch(0.928 0.006 264.531)`; border `rgb(255 255 255 / 10%)`.
- Radius: `0.625rem`; derived sm/md/lg/xl tokens from radius.
- Brand accent in home filters: violet-600 active chips; subtle home atmosphere radial gradients.
- Responsive breakpoint used by pagination logic: `sm`/640px. Mobile controls use minimum 44px touch targets.

## Source

Full theme source: `src/app/globals.css`. Keep existing colors, font family, radius, atmosphere, and desktop navigation treatment unless the specific mobile defect requires a local adjustment.
