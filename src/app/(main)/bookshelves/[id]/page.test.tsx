import { render, screen } from "@testing-library/react";
import BookshelvesPage from "./page";
import ClientBookshelves from "@/modules/bookshelves";

vi.mock("@/modules/bookshelves", () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="bookshelves-client" />),
}));

describe("BookshelvesPage [id]", () => {
  it("renders the client module inside a main landmark", () => {
    const { container } = render(<BookshelvesPage />);
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("max-w-7xl");
    expect(screen.getByTestId("bookshelves-client")).toBeInTheDocument();
  });

  it("imports the bookshelves client as default export", () => {
    render(<BookshelvesPage />);
    expect(ClientBookshelves).toHaveBeenCalled();
  });
});
