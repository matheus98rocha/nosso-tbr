import { renderHook, act, waitFor } from "@testing-library/react";
import { useLogin } from "./useLogin";
import { useUserStore } from "@/stores/userStore";
import { vi } from "vitest";
import { TestQueryWrapper } from "@/test-utils/QueryWrapper";

const mockSignIn = vi.fn();
vi.mock("../services/auth.service", () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    signIn: mockSignIn,
  })),
}));

const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({
      user: null,
      loading: false,
      error: null,
      isLoggingOut: false,
    });
  });

  it("should login and set user correctly", async () => {
    mockSignIn.mockResolvedValue({
      data: { user: { id: "1", email: "test@example.com" } },
      error: null,
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: TestQueryWrapper,
    });

    await act(async () => {
      await result.current.onSubmit({
        email: "test@example.com",
        password: "123",
      });
    });

    const user = useUserStore.getState().user;
    expect(user?.email).toBe("test@example.com");
  });

  it("should login and redirect correctly", async () => {
    const mockUser = { id: "1", email: "test@example.com" };
    mockSignIn.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: TestQueryWrapper,
    });

    await act(async () => {
      await result.current.onSubmit({
        email: "test@example.com",
        password: "123",
      });
    });

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith(`/?userId=${mockUser.id}`);
  });

  it("should handle login error", async () => {
    mockSignIn.mockResolvedValue({
      data: null,
      error: { message: "Invalid credentials" },
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: TestQueryWrapper,
    });

    await act(async () => {
      await result.current.mutation
        .mutateAsync({
          email: "wrong@example.com",
          password: "wrong",
        })
        .catch(() => {}); // Captura o erro
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe("Invalid credentials");
  });
});
