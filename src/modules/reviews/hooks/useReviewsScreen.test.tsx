import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEWS_PATH } from "@/lib/routes/reviews";
import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { resetReviewComposerStore, useReviewComposerStore } from "../stores";
import { useReviewsScreen } from "./useReviewsScreen";

const USER_ID = "660e8400-e29b-41d4-a716-446655440002";

const nav = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: "/reviews",
  params: new URLSearchParams(),
}));

const { getFollowingIds } = vi.hoisted(() => ({
  getFollowingIds: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.params,
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function (this: { getFollowingIds: typeof getFollowingIds }) {
    this.getFollowingIds = getFollowingIds;
  }),
}));

vi.mock("./useReviewFeed", () => ({
  useReviewFeed: (scope: string) => ({ scope, reviews: [] }),
}));

let queryClient: QueryClient;
let resolveFollowing: (ids: string[]) => void = () => undefined;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useReviewsScreen", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false },
      },
    });
    nav.replace.mockReset();
    nav.pathname = "/reviews";
    nav.params = new URLSearchParams("aba=seguindo&livro=hobbit");
    getFollowingIds.mockReset();
    getFollowingIds.mockImplementation(
      () =>
        new Promise<string[]>((resolve) => {
          resolveFollowing = resolve;
        }),
    );
    useUserStore.setState({ user: { id: USER_ID } as User, sessionReady: true });
    resetReviewComposerStore();
  });

  it("troca a aba sem perder os outros parâmetros e abre o compositor em branco", async () => {
    const { result, rerender } = renderHook(() => useReviewsScreen(), { wrapper });

    expect(result.current.tab).toBe("seguindo");
    expect(result.current.scope).toBe("following");
    expect(result.current.feed).toMatchObject({ scope: "following" });

    act(() => {
      result.current.setTab("geral");
    });
    expect(nav.replace).toHaveBeenCalledWith("/reviews?livro=hobbit");

    act(() => {
      result.current.setTab("minhas");
    });
    expect(nav.replace).toHaveBeenLastCalledWith("/reviews?aba=minhas&livro=hobbit");

    nav.params = new URLSearchParams();
    rerender();
    expect(result.current.tab).toBe("geral");
    expect(result.current.scope).toBe("all");

    nav.pathname = "";
    rerender();
    act(() => {
      result.current.setTab("geral");
    });
    expect(nav.replace).toHaveBeenLastCalledWith(REVIEWS_PATH);

    useReviewComposerStore.setState({
      open: false,
      mode: "finish",
      book: {
        id: "book-1",
        title: "O Hobbit",
        author: "Tolkien",
        imageUrl: null,
        status: "finished",
        isSolo: true,
      },
    });
    act(() => {
      result.current.openComposer();
    });
    expect(useReviewComposerStore.getState()).toMatchObject({
      open: true,
      mode: "compose",
      book: null,
    });
  });

  it("só trata a lista de seguidos como vazia depois que ela chega vazia", async () => {
    const { result } = renderHook(() => useReviewsScreen(), { wrapper });

    await waitFor(() => expect(getFollowingIds).toHaveBeenCalledTimes(1));
    expect(result.current.followsNobody).toBe(false);

    await act(async () => {
      resolveFollowing([]);
    });
    await waitFor(() => expect(result.current.followsNobody).toBe(true));
  });

  it("não diz que a pessoa não segue ninguém quando a consulta falha ou há seguidos", async () => {
    getFollowingIds.mockResolvedValue(["other"]);
    const followed = renderHook(() => useReviewsScreen(), { wrapper });
    await waitFor(() => expect(followed.result.current.followsNobody).toBe(false));
    await waitFor(() => {
      expect(queryClient.getQueryState(["userSocial", "following", USER_ID])?.status).toBe(
        "success",
      );
    });
    expect(followed.result.current.followsNobody).toBe(false);
    followed.unmount();

    queryClient.clear();
    getFollowingIds.mockRejectedValue(new Error("follows down"));
    const failed = renderHook(() => useReviewsScreen(), { wrapper });
    await waitFor(() => {
      expect(queryClient.getQueryState(["userSocial", "following", USER_ID])?.status).toBe(
        "error",
      );
    });
    expect(failed.result.current.followsNobody).toBe(false);
    failed.unmount();

    queryClient.clear();
    getFollowingIds.mockClear();
    useUserStore.setState({ user: null, sessionReady: false });
    const signedOut = renderHook(() => useReviewsScreen(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(getFollowingIds).not.toHaveBeenCalled();
    expect(signedOut.result.current.followsNobody).toBe(false);
  });
});
