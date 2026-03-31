import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { YearFilterChips } from "./yearFilterChips";

const CURRENT_YEAR = new Date().getFullYear();
const EXPECTED_YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

function renderYearChips(activeYear?: number, onSelect = vi.fn()) {
  return { onSelect, ...render(<YearFilterChips activeYear={activeYear} onSelect={onSelect} />) };
}

describe("YearFilterChips", () => {
  describe("rendering", () => {
    it("renders the 'Ano' section label", () => {
      renderYearChips();
      expect(screen.getByText("Ano")).toBeInTheDocument();
    });

    it("renders exactly 6 year buttons", () => {
      renderYearChips();
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(6);
    });

    it("renders the current year as the first button", () => {
      renderYearChips();
      const buttons = screen.getAllByRole("button");
      expect(buttons[0]).toHaveTextContent(String(CURRENT_YEAR));
    });

    it("renders all 6 years in descending order", () => {
      renderYearChips();
      const buttons = screen.getAllByRole("button");
      EXPECTED_YEARS.forEach((year, idx) => {
        expect(buttons[idx]).toHaveTextContent(String(year));
      });
    });

    it("renders without crashing when activeYear is undefined", () => {
      renderYearChips(undefined);
      expect(screen.getAllByRole("button")).toHaveLength(6);
    });

    it("renders without crashing when activeYear is not in the rendered range", () => {
      renderYearChips(1990);
      expect(screen.getAllByRole("button")).toHaveLength(6);
    });
  });

  describe("interaction", () => {
    it("calls onSelect with the year when an inactive button is clicked", () => {
      const { onSelect } = renderYearChips(undefined);
      fireEvent.click(screen.getByText(String(CURRENT_YEAR)));
      expect(onSelect).toHaveBeenCalledWith(CURRENT_YEAR);
    });

    it("calls onSelect with undefined when the active year is clicked (deselect)", () => {
      const { onSelect } = renderYearChips(CURRENT_YEAR);
      fireEvent.click(screen.getByText(String(CURRENT_YEAR)));
      expect(onSelect).toHaveBeenCalledWith(undefined);
    });

    it("calls onSelect with the new year when a different inactive year is clicked", () => {
      const previousYear = CURRENT_YEAR - 1;
      const { onSelect } = renderYearChips(CURRENT_YEAR);
      fireEvent.click(screen.getByText(String(previousYear)));
      expect(onSelect).toHaveBeenCalledWith(previousYear);
    });

    it("calls onSelect exactly once per click", () => {
      const { onSelect } = renderYearChips();
      fireEvent.click(screen.getByText(String(CURRENT_YEAR)));
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("calls onSelect on every year button without errors", () => {
      const { onSelect } = renderYearChips();
      EXPECTED_YEARS.forEach((year) => {
        fireEvent.click(screen.getByText(String(year)));
      });
      expect(onSelect).toHaveBeenCalledTimes(EXPECTED_YEARS.length);
    });
  });

  describe("active state", () => {
    it("active year button is still present and clickable", () => {
      const { onSelect } = renderYearChips(CURRENT_YEAR);
      const activeButton = screen.getByText(String(CURRENT_YEAR));
      expect(activeButton).toBeInTheDocument();
      fireEvent.click(activeButton);
      expect(onSelect).toHaveBeenCalled();
    });

    it("only the active year triggers deselect (undefined), others trigger select", () => {
      const { onSelect } = renderYearChips(CURRENT_YEAR);
      const previousYear = CURRENT_YEAR - 1;

      fireEvent.click(screen.getByText(String(CURRENT_YEAR)));
      expect(onSelect).toHaveBeenCalledWith(undefined);

      fireEvent.click(screen.getByText(String(previousYear)));
      expect(onSelect).toHaveBeenCalledWith(previousYear);
    });
  });

  describe("mobile responsiveness", () => {
    it("container has flex-wrap to prevent overflow on small screens", () => {
      const { container } = renderYearChips();
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("flex-wrap");
    });

    it("each year button has minimum height class for touch targets (h-8 = 32px)", () => {
      renderYearChips();
      screen.getAllByRole("button").forEach((button) => {
        expect(button.className).toContain("h-8");
      });
    });

    it("renders all buttons without overflow at 375px viewport width", () => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
      renderYearChips();
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(6);
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
    });

    it("container spans full width via w-full class", () => {
      const { container } = renderYearChips();
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("w-full");
    });
  });

  describe("edge cases", () => {
    it("does not throw when onSelect is called with the oldest available year", () => {
      const oldestYear = CURRENT_YEAR - 5;
      const { onSelect } = renderYearChips();
      expect(() => fireEvent.click(screen.getByText(String(oldestYear)))).not.toThrow();
      expect(onSelect).toHaveBeenCalledWith(oldestYear);
    });

    it("renders stably when switching active year between renders", () => {
      const { rerender, onSelect } = renderYearChips(CURRENT_YEAR);
      rerender(<YearFilterChips activeYear={CURRENT_YEAR - 1} onSelect={onSelect} />);
      expect(screen.getAllByRole("button")).toHaveLength(6);
    });
  });
});
