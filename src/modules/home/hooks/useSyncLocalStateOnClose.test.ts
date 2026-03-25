import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { FiltersOptions } from "@/types/filters";
import {
  areFiltersOptionsEqual,
  useSyncLocalStateOnClose,
} from "./useSyncLocalStateOnClose";

const baseFilters: FiltersOptions = {
  readers: [],
  status: [],
  gender: [],
  view: "todos",
};

describe("useSyncLocalStateOnClose", () => {
  it("syncs local state after closing when filters changed", () => {
    const syncLocalState = vi.fn();
    const { rerender } = renderHook(
      ({ externalState, isOpen }) =>
        useSyncLocalStateOnClose({
          externalState,
          isOpen,
          syncLocalState,
          areEqual: areFiltersOptionsEqual,
        }),
      {
        initialProps: {
          externalState: baseFilters,
          isOpen: true,
        },
      },
    );

    rerender({
      externalState: { ...baseFilters, status: ["reading"] },
      isOpen: false,
    });

    expect(syncLocalState).toHaveBeenCalledWith({
      ...baseFilters,
      status: ["reading"],
    });
  });

  it("does not sync while state container remains open", () => {
    const syncLocalState = vi.fn();
    const { rerender } = renderHook(
      ({ externalState, isOpen }) =>
        useSyncLocalStateOnClose({
          externalState,
          isOpen,
          syncLocalState,
          areEqual: areFiltersOptionsEqual,
        }),
      {
        initialProps: {
          externalState: baseFilters,
          isOpen: true,
        },
      },
    );

    rerender({
      externalState: { ...baseFilters, status: ["paused"] },
      isOpen: true,
    });

    expect(syncLocalState).not.toHaveBeenCalled();
  });

  it("syncs primitive values with default equality", () => {
    const syncLocalState = vi.fn();
    const { rerender } = renderHook(
      ({ externalState, isOpen }) =>
        useSyncLocalStateOnClose({
          externalState,
          isOpen,
          syncLocalState,
        }),
      {
        initialProps: {
          externalState: "title_asc",
          isOpen: true,
        },
      },
    );

    rerender({
      externalState: "date_desc",
      isOpen: false,
    });

    expect(syncLocalState).toHaveBeenCalledWith("date_desc");
  });
});
