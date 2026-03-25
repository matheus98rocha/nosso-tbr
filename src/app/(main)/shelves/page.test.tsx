import { render, screen } from "@testing-library/react";
import ShelvesPage from "./page";
import ClienteShelves from "@/modules/shelves";

vi.mock("@/modules/shelves", () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="shelves-client" />),
}));

describe("ShelvesPage", () => {
  it("renders the client module inside a main landmark", () => {
    const { container } = render(<ShelvesPage />);
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("max-w-7xl");
    expect(screen.getByTestId("shelves-client")).toBeInTheDocument();
  });

  it("imports the shelves client as default export", () => {
    render(<ShelvesPage />);
    expect(ClienteShelves).toHaveBeenCalled();
  });
});
