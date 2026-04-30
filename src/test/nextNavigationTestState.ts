import { vi } from "vitest";

import { SHELVES_LIST_PATH } from "@/lib/routes/shelves";

export const nextNavigationTestState = {
  pathname: "/" as string,
  params: {} as Record<string, string | string[]>,
  searchParamsSerialized: "",
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  },
};

export function resetNextNavigationTestState() {
  nextNavigationTestState.pathname = "/";
  nextNavigationTestState.params = {};
  nextNavigationTestState.searchParamsSerialized = "";
  nextNavigationTestState.router.push.mockClear();
  nextNavigationTestState.router.replace.mockClear();
  nextNavigationTestState.router.prefetch.mockClear();
}

export function presetNextNavigationShelvesList() {
  nextNavigationTestState.pathname = SHELVES_LIST_PATH;
  nextNavigationTestState.params = {};
  nextNavigationTestState.searchParamsSerialized = "";
}

export function presetNextNavigationBookshelfDetail(shelfId: string) {
  nextNavigationTestState.pathname = `/bookshelves/${shelfId}`;
  nextNavigationTestState.params = { id: shelfId };
  nextNavigationTestState.searchParamsSerialized = "";
}
