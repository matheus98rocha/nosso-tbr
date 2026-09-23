# Nosso TBR — mobile home UX context

## Product and target

Nosso TBR is a Portuguese reading-tracker/community app. The target is the existing `/` home rendered at mobile widths. The current visual language is already coherent: Geist Sans UI, Newsreader display treatment for brand/count headings, neutral white/slate surfaces, violet active filter chips, Lucide icons, shadcn New York primitives, rounded 2xl cards, subtle borders and the existing home atmosphere. Preserve this language.

## UX objective

Improve only the mobile usability defects: pagination items breaking or becoming hard to reach, filters feeling dense/unclear, and the expanded navigation obscuring the page. Do not redesign healthy desktop behavior, book cards, branding, copy hierarchy, or working interactions. Favor small, reversible, localized changes.

## Required design direction

- Mobile-first layout at approximately 320–430px; every primary control has a comfortable 44px touch target.
- Pagination must remain contained within the viewport, make the current page obvious, and offer clear previous/next access without wrapping or horizontal page-number breakage.
- Filters should expose a compact summary and count of active filters, then open a focused mobile sheet/drawer with grouped sections, sticky actions, and an obvious close/apply path. Preserve current filter semantics and URL behavior.
- The extended mobile menu must behave as a non-obstructive overlay/sheet or anchored surface with correct z-index, safe-area spacing, focus/escape handling, and enough page context to navigate without covering the reading list unnecessarily. Preserve existing routes and labels.
- Keep the existing colors, fonts, radii, icon family, active violet states, and desktop layout. Avoid new gradients, fonts, illustrations, or decorative elements.
- Accessibility: semantic labels, aria-expanded/aria-controls, visible focus, reduced-motion support, keyboard escape, and readable contrast.

## Acceptance lens

Check 320px, 375px, 390px, and 430px widths; no horizontal page overflow; no menu/filter surface covering the primary context after opening; active filters remain understandable after collapse; pagination controls are usable at first, middle, and last page; closing/canceling filters leaves URL/state unchanged; applying filters preserves existing query semantics.

Use ONLY the fonts, colors, spacing, and component styles defined in this design system. Do not introduce any fonts, colors, or visual styles not in the design system.
