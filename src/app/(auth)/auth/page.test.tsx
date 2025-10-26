import { render, screen } from "@testing-library/react";
import AuthPage from "./page";
import LoginForm from "@/modules/auth";

vi.mock("@/modules/auth", () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="login-form" />),
}));

describe("AuthPage", () => {
  it("should render without crashing", () => {
    render(<AuthPage />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("should render the LoginForm component", () => {
    render(<AuthPage />);
    expect(LoginForm).toHaveBeenCalled();
  });
});
