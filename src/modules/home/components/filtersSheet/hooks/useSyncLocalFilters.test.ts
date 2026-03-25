import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { FiltersOptions } from "@/types/filters";
import { useSyncLocalFilters } from "./useSyncLocalFilters";

const baseFilters: FiltersOptions = {
  readers: [],
  status: [],
  gender: [],
  view: "todos",
};

describe("useSyncLocalFilters", () => {
  it("syncs local filters after closing the sheet when external filters changed", () => {
    const resetLocalFilters = vi.fn();
    const { rerender } = renderHook(
      ({ externalFilters, isOpen }) =>
        useSyncLocalFilters(externalFilters, isOpen, resetLocalFilters),
      {
        initialProps: {
          externalFilters: baseFilters,
          isOpen: true,
        },
      },
    );

    rerender({
      externalFilters: { ...baseFilters, status: ["reading"] },
      isOpen: false,
    });

    expect(resetLocalFilters).toHaveBeenCalledWith({
      ...baseFilters,
      status: ["reading"],
    });
  });

  it("does not sync while the sheet remains open", () => {
    const resetLocalFilters = vi.fn();
    const { rerender } = renderHook(
      ({ externalFilters, isOpen }) =>
        useSyncLocalFilters(externalFilters, isOpen, resetLocalFilters),
      {
        initialProps: {
          externalFilters: baseFilters,
          isOpen: true,
        },
      },
    );

    rerender({
      externalFilters: { ...baseFilters, status: ["paused"] },
      isOpen: true,
    });

    expect(resetLocalFilters).not.toHaveBeenCalled();
  });

  it("supports primitive values for sort synchronization", () => {
    const resetLocalSort = vi.fn();
    const { rerender } = renderHook(
      ({ externalSort, isOpen }) =>
        useSyncLocalFilters(externalSort, isOpen, resetLocalSort),
      {
        initialProps: {
          externalSort: "title_asc",
          isOpen: true,
        },
      },
    );

    rerender({
      externalSort: "date_desc",
      isOpen: false,
    });

    expect(resetLocalSort).toHaveBeenCalledWith("date_desc");
  });
});
