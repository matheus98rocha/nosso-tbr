import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useStatusFilters } from "./useStatusFilters";
import { FiltersOptions } from "@/types/filters";

const baseFilters: FiltersOptions = {
  readers: [],
  status: [],
  gender: [],
  view: "todos",
};

const renderStatusFiltersHook = (
  filterOverrides: Partial<FiltersOptions> = {},
  searchQuery = "",
) => {
  const updateUrlWithFilters = vi.fn();
  const filters = { ...baseFilters, ...filterOverrides };
  const { result } = renderHook(() =>
    useStatusFilters({ filters, searchQuery, updateUrlWithFilters }),
  );
  return { result, updateUrlWithFilters, filters };
};

describe("useStatusFilters", () => {
  describe("activeStatuses", () => {
    it("returns empty array when filters.status is empty", () => {
      const { result } = renderStatusFiltersHook();
      expect(result.current.activeStatuses).toEqual([]);
    });

    it("returns pre-populated statuses from filters", () => {
      const { result } = renderStatusFiltersHook({
        status: ["reading", "paused"],
      });
      expect(result.current.activeStatuses).toEqual(["reading", "paused"]);
    });

    it("handles undefined filters.status gracefully", () => {
      const { result } = renderStatusFiltersHook({ status: undefined });
      expect(result.current.activeStatuses).toEqual([]);
    });
  });

  describe("handleToggleStatus", () => {
    it("adds a status when it is not active", () => {
      const { result, updateUrlWithFilters } = renderStatusFiltersHook();

      act(() => result.current.handleToggleStatus("paused"));

      expect(updateUrlWithFilters).toHaveBeenCalledWith(
        { ...baseFilters, status: ["paused"] },
        "",
      );
    });

    it("removes a status when it is already active", () => {
      const { result, updateUrlWithFilters } = renderStatusFiltersHook({
        status: ["reading", "abandoned"],
      });

      act(() => result.current.handleToggleStatus("reading"));

      expect(updateUrlWithFilters).toHaveBeenCalledWith(
        { ...baseFilters, status: ["abandoned"] },
        "",
      );
    });

    it("removes the last active status resulting in empty array", () => {
      const { result, updateUrlWithFilters } = renderStatusFiltersHook({
        status: ["planned"],
      });

      act(() => result.current.handleToggleStatus("planned"));

      expect(updateUrlWithFilters).toHaveBeenCalledWith(
        { ...baseFilters, status: [] },
        "",
      );
    });

    it("preserves other filters and searchQuery when toggling", () => {
      const updateUrlWithFilters = vi.fn();
      const filters: FiltersOptions = {
        readers: ["Matheus"],
        status: [],
        gender: ["fiction"],
        view: "todos",
      };

      const { result } = renderHook(() =>
        useStatusFilters({ filters, searchQuery: "senhor dos aneis", updateUrlWithFilters }),
      );

      act(() => result.current.handleToggleStatus("abandoned"));

      expect(updateUrlWithFilters).toHaveBeenCalledWith(
        {
          readers: ["Matheus"],
          status: ["abandoned"],
          gender: ["fiction"],
          view: "todos",
        },
        "senhor dos aneis",
      );
    });

    it("allows multiple statuses to be active simultaneously", () => {
      const { result, updateUrlWithFilters } = renderStatusFiltersHook({
        status: ["reading"],
      });

      act(() => result.current.handleToggleStatus("paused"));

      expect(updateUrlWithFilters).toHaveBeenCalledWith(
        { ...baseFilters, status: ["reading", "paused"] },
        "",
      );
    });

    it("calls updateUrlWithFilters exactly once per toggle", () => {
      const { result, updateUrlWithFilters } = renderStatusFiltersHook();

      act(() => result.current.handleToggleStatus("not_started"));

      expect(updateUrlWithFilters).toHaveBeenCalledTimes(1);
    });
  });
});
