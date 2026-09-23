# Page dependency trees

## `/` Home

Entry: `src/app/(main)/page.tsx`

Dependencies:
- `src/modules/home/index.tsx`
  - `src/modules/home/hooks/useHome.ts`
  - `src/modules/home/components/collapsibleBookFilters/collapsibleBookFilters.tsx`
  - `src/modules/home/components/filtersSheet/filters.tsx`
  - `src/modules/home/components/homeQuickActions/homeQuickActions.tsx`
  - `src/components/defaultPagintation/defaultPagination.tsx`
  - `src/components/statusFilterChips/statusFilterChips.tsx`
  - `src/components/yearFilterChips/yearFilterChips.tsx`
  - `src/components/sortFilterChips/sortFilterChips.tsx`
  - `src/components/bookCard/*`
  - `src/components/listGrid/*`
  - `src/components/ui/*` primitives used by the above
- `src/app/(main)/layout.tsx`
  - `src/components/header/header.tsx`
    - `src/components/header/components/navMenu/navMenu.tsx`
    - `src/components/header/components/homeSearchBar/homeSearchBar.tsx`
    - `src/components/header/components/headerAccountMenu.tsx`
- `src/app/globals.css`

The actual home render has a responsive header, quick actions, book count/search context, collapsible filter groups, book grid/list, and pagination. Mobile-specific fixes must not alter book-card behavior or desktop navigation without evidence.
