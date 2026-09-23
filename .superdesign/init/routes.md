# Routes

Next.js App Router route map.

- `/` → `src/app/(main)/page.tsx` → `ClientHome` from `src/modules/home/index.tsx`, wrapped by `src/app/(main)/layout.tsx` and `Header`.
- `/community` → community page.
- `/shelves` and `/bookshelves/[id]` → shelf views.
- `/profile` and `/profile/[userId]` → profile views.
- `/stats` → stats dashboard.
- `/schedule/[id]/[title]` → reading schedule.
- `/collective-reading/[id]/[title]` → collective reading.
- `/quotes/[title]/[id]` → quote view.

Target is the existing rendered `/` home on mobile.
