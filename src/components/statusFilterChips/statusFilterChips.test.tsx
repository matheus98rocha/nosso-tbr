import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { StatusFilterChips } from "./statusFilterChips";
import { Status } from "@/types/books.types";

const LABEL_TO_STATUS: Record<string, Status> = {
  "Não Iniciado": "not_started",
  "Vou Iniciar": "planned",
  "Estou Lendo": "reading",
  Pausado: "paused",
  Abandonado: "abandoned",
  Terminei: "finished",
};

const ALL_LABELS = Object.keys(LABEL_TO_STATUS);

describe("StatusFilterChips", () => {
  describe("rendering", () => {
    it("renders all six status chips", () => {
      render(<StatusFilterChips activeStatuses={[]} onToggle={vi.fn()} />);

      ALL_LABELS.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it("renders all chips as buttons", () => {
      render(<StatusFilterChips activeStatuses={[]} onToggle={vi.fn()} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(ALL_LABELS.length);
    });

    it("renders without crashing when all statuses are active", () => {
      const allStatuses: Status[] = [
        "not_started",
        "planned",
        "reading",
        "paused",
        "abandoned",
        "finished",
      ];

      render(
        <StatusFilterChips activeStatuses={allStatuses} onToggle={vi.fn()} />,
      );

      ALL_LABELS.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe("interaction", () => {
    it("calls onToggle with correct status when each chip is clicked", () => {
      const onToggle = vi.fn();
      render(<StatusFilterChips activeStatuses={[]} onToggle={onToggle} />);

      Object.entries(LABEL_TO_STATUS).forEach(([label, status]) => {
        fireEvent.click(screen.getByText(label));
        expect(onToggle).toHaveBeenCalledWith(status);
      });

      expect(onToggle).toHaveBeenCalledTimes(ALL_LABELS.length);
    });

    it("calls onToggle with 'paused' when 'Pausado' is clicked", () => {
      const onToggle = vi.fn();
      render(<StatusFilterChips activeStatuses={[]} onToggle={onToggle} />);

      fireEvent.click(screen.getByText("Pausado"));

      expect(onToggle).toHaveBeenCalledWith("paused");
    });

    it("calls onToggle with 'abandoned' when 'Abandonado' is clicked", () => {
      const onToggle = vi.fn();
      render(<StatusFilterChips activeStatuses={[]} onToggle={onToggle} />);

      fireEvent.click(screen.getByText("Abandonado"));

      expect(onToggle).toHaveBeenCalledWith("abandoned");
    });
  });

  describe("active state", () => {
    it("active chip is still rendered and clickable", () => {
      const onToggle = vi.fn();
      render(
        <StatusFilterChips activeStatuses={["paused"]} onToggle={onToggle} />,
      );

      const activeChip = screen.getByText("Pausado");
      expect(activeChip).toBeInTheDocument();

      fireEvent.click(activeChip);
      expect(onToggle).toHaveBeenCalledWith("paused");
    });

    it("inactive chips remain clickable when some statuses are active", () => {
      const onToggle = vi.fn();
      render(
        <StatusFilterChips
          activeStatuses={["reading", "finished"]}
          onToggle={onToggle}
        />,
      );

      fireEvent.click(screen.getByText("Abandonado"));
      expect(onToggle).toHaveBeenCalledWith("abandoned");
    });
  });
});
