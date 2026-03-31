import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Pagination from "./defaultPagination";

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("(min-width: 640px)"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("DefaultPagination", () => {
  beforeEach(() => {
    stubMatchMedia();
    vi.spyOn(document, "getElementById").mockReturnValue(null);
  });

  it("renders navigation labels and page links", async () => {
    const user = userEvent.setup();
    const setCurrentPage = vi.fn();

    render(
      <Pagination
        currentPage={0}
        totalPages={3}
        setCurrentPage={setCurrentPage}
        prevText="Previous"
        nextText="Next"
      />,
    );

    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByLabelText("Go to page 2")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Go to page 2"));
    expect(setCurrentPage).toHaveBeenCalledWith(1);
  });

  it("renders nothing when only one page exists", () => {
    const { container } = render(
      <Pagination currentPage={0} totalPages={1} setCurrentPage={vi.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
