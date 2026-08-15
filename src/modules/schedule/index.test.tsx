import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ClientSchedule from "./index";

vi.mock("./components/createScheduleForm", () => ({
  CreateScheduleForm: () => <div data-testid="create-schedule-form" />,
}));

vi.mock("./components/readingProgressIndicator", () => ({
  PageReadingProgressIndicator: () => null,
}));

vi.mock("./components/scheduleTable", () => ({
  ScheduleTable: () => null,
}));

vi.mock("./hooks", () => ({
  useSchedule: vi.fn(),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(() => ({ user: { id: "user-1" } })),
}));

import { useSchedule } from "./hooks";

const mockedUseSchedule = vi.mocked(useSchedule);

const baseHookReturn = {
  schedule: [],
  updateIsCompleted: vi.fn(),
  deleteSchedule: vi.fn(),
  isLoadingSchedule: false,
  isError: false,
  shouldDisplayScheduleTable: false,
  emptySchedule: true,
  isReadTogglePending: false,
  pendingScheduleId: null,
};

describe("ClientSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseSchedule.mockReturnValue(baseHookReturn);
  });

  it("shows error state when schedule query fails", () => {
    mockedUseSchedule.mockReturnValue({
      ...baseHookReturn,
      isError: true,
      emptySchedule: false,
    });

    render(<ClientSchedule id="book-1" title="Livro" />);

    expect(screen.getByText("Ops... Algo deu errado.")).toBeInTheDocument();
    expect(screen.queryByTestId("create-schedule-form")).not.toBeInTheDocument();
  });

  it("shows create form when schedule is empty and query succeeds", () => {
    render(<ClientSchedule id="book-1" title="Livro" />);

    expect(screen.getByTestId("create-schedule-form")).toBeInTheDocument();
  });
});
