import "@testing-library/jest-dom";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { beforeEach, vi } from "vitest";

import {
  nextNavigationTestState,
  resetNextNavigationTestState,
} from "@/test/nextNavigationTestState";

vi.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn(),
    },
  })),
}));

beforeEach(() => {
  resetNextNavigationTestState();
  vi.mocked(useRouter).mockImplementation(
    () =>
      nextNavigationTestState.router as unknown as ReturnType<typeof useRouter>,
  );
  vi.mocked(usePathname).mockImplementation(
    () =>
      nextNavigationTestState.pathname as unknown as ReturnType<
        typeof usePathname
      >,
  );
  vi.mocked(useSearchParams).mockImplementation(() => {
    return new URLSearchParams(
      nextNavigationTestState.searchParamsSerialized,
    ) as unknown as ReturnType<typeof useSearchParams>;
  });
  vi.mocked(useParams).mockImplementation(
    () =>
      ({ ...nextNavigationTestState.params }) as unknown as ReturnType<
        typeof useParams
      >,
  );
});
