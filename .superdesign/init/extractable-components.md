# Extractable components

## Layout

- `Header` — `src/components/header/header.tsx` — shared top navigation; preserve active route, logo, account state, and mobile menu behavior while improving only obstruction/positioning.
- `NavMenu` — `src/components/header/components/navMenu/navMenu.tsx` — desktop/mobile navigation surface; key state is active item and open state.

## Basic/home

- `CollapsibleBookFilters` — `src/modules/home/components/collapsibleBookFilters/collapsibleBookFilters.tsx` — home filter container; key state is collapsed/open and active filter summary.
- `FiltersSheet` — `src/modules/home/components/filtersSheet/filters.tsx` — mobile filter sheet; key state is open, selected filters, and apply/cancel actions.
- `DefaultPagination` — `src/components/defaultPagintation/defaultPagination.tsx` — responsive pagination; key state is current page and total pages.
- `StatusFilterChips`, `YearFilterChips`, `SortFilterChips` — reusable filter controls with active selection props.
- `HomeQuickActions` — `src/modules/home/components/homeQuickActions/homeQuickActions.tsx` — home actions; preserve current actions and only adjust mobile placement if it collides with content.
