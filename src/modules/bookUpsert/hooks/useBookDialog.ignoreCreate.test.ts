import { renderHook } from "@testing-library/react";
import { Mock, vi } from "vitest";
import { useBookDialog } from "./useBookDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useBookPreCreationValidation } from "./useBookPreCreationValidation";

vi.mock("./useBookPreCreationValidation", () => ({
  useBookPreCreationValidation: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(),
  useRequireAuth: vi.fn(() => ({ id: "user-1" })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/modules/shelves/services/booksshelves.service", () => ({
  fetchBookShelves: vi.fn(),
  BookshelfService: vi.fn(function (this: Record<string, unknown>) {
    this.addBookToShelf = vi.fn().mockResolvedValue(undefined);
  }),
}));

vi.mock("sonner", () => ({ toast: vi.fn() }));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: vi.fn(() => vi.fn()),
}));

vi.mock("react-hook-form", () => ({
  useForm: vi.fn(() => ({
    reset: vi.fn(),
    handleSubmit: vi.fn((fn) => fn),
    control: {},
    getValues: vi.fn(() => ({})),
    setValue: vi.fn(),
    watch: vi.fn(),
  })),
}));

vi.mock("@/modules/home/validators/createBook.validator", () => ({
  bookCreateSchema: {},
}));

const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockPush = vi.fn();

const mockShelves = [
  { id: "shelf-1", name: "Favoritos" },
  { id: "shelf-2", name: "Lidos" },
];

const pendingPayload = {
  title: "Ignorar fluxo",
  author_id: "author-1",
  chosen_by: "user-1",
  readers: ["user-1"],
  pages: 200,
};

describe("useBookDialog — ignorar sugestão e criar novo livro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useIsLoggedIn as Mock).mockReturnValue(true);
    (useRouter as Mock).mockReturnValue({ push: mockPush, replace: vi.fn() });
    (useQueryClient as Mock).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });
    (useQuery as Mock).mockReturnValue({
      data: mockShelves,
      isLoading: false,
    });
    (useMutation as Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    });

    const takePendingPayloadForCreation = vi.fn().mockReturnValue(pendingPayload);

    (useBookPreCreationValidation as Mock).mockReturnValue({
      isDiscoveryOpen: false,
      isParticipationBlockOpen: false,
      matchedBook: null,
      validateBeforeCreate: vi.fn().mockResolvedValue({ type: "create_new" }),
      closeDiscovery: vi.fn(),
      closeParticipationBlock: vi.fn(),
      linkUserToExistingBook: vi.fn(),
      takePendingPayloadForCreation,
    });
  });

  it("handleIgnoreAndCreateNewBook chama createBook.mutate com o payload pendente", () => {
    const { result } = renderHook(() =>
      useBookDialog({
        bookData: undefined,
        setIsBookFormOpen: vi.fn(),
        chosenByOptions: [],
      }),
    );

    result.current.handleIgnoreAndCreateNewBook();

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(pendingPayload);
  });

  it("handleIgnoreAndCreateNewBook não chama mutate quando não há payload pendente", () => {
    (useBookPreCreationValidation as Mock).mockReturnValue({
      isDiscoveryOpen: false,
      isParticipationBlockOpen: false,
      matchedBook: null,
      validateBeforeCreate: vi.fn().mockResolvedValue({ type: "create_new" }),
      closeDiscovery: vi.fn(),
      closeParticipationBlock: vi.fn(),
      linkUserToExistingBook: vi.fn(),
      takePendingPayloadForCreation: vi.fn().mockReturnValue(null),
    });

    const { result } = renderHook(() =>
      useBookDialog({
        bookData: undefined,
        setIsBookFormOpen: vi.fn(),
        chosenByOptions: [],
      }),
    );

    result.current.handleIgnoreAndCreateNewBook();

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
