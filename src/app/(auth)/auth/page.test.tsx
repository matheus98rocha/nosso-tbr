import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LoginState } from "@/modules/auth/actions/login";
import { nextNavigationTestState } from "@/test";

import AuthPage from "./page";

const loginActionSpy = vi.hoisted(() =>
  vi.fn(
    async (...args: [LoginState, FormData]): Promise<LoginState> => {
      void args;
      return {
        error: null,
        message: null,
      };
    },
  ),
);

vi.mock("@/modules/auth/actions/login", () => ({
  loginAction: (prevState: LoginState, formData: FormData) =>
    loginActionSpy(prevState, formData),
}));

describe("AuthPage", () => {
  beforeEach(() => {
    loginActionSpy.mockClear();
    loginActionSpy.mockResolvedValue({
      error: null,
      message: null,
    });
  });

  it("renderiza cartão de login com e-mail, senha e ação de entrar", async () => {
    render(<AuthPage />);

    expect(screen.getByRole("form", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit sign in/i }),
    ).toHaveTextContent("Entrar");
    expect(screen.getByText("Nosso TBR")).toBeInTheDocument();
  });

  it("navega para recuperação de senha ao acionar Esqueci a senha", async () => {
    const user = userEvent.setup();
    render(<AuthPage />);

    await user.click(screen.getByRole("button", { name: /Forgot password/i }));

    expect(nextNavigationTestState.router.push).toHaveBeenCalledWith(
      "/forgot-password",
    );
  });

  it("envia loginAction com e-mail e senha do formulário", async () => {
    const user = userEvent.setup();
    render(<AuthPage />);

    await user.type(screen.getByLabelText("Email"), "leitor@example.com");
    await user.type(screen.getByLabelText("Password"), "senhaSegura8");
    await user.click(screen.getByRole("button", { name: /submit sign in/i }));

    await waitFor(() => {
      expect(loginActionSpy).toHaveBeenCalled();
    });

    const first = loginActionSpy.mock.calls[0];
    expect(first?.length).toBeGreaterThanOrEqual(2);
    const formData = first![1];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("email")).toBe("leitor@example.com");
    expect(formData.get("password")).toBe("senhaSegura8");
  });

  it("exibe mensagem de erro retornada por loginAction", async () => {
    loginActionSpy.mockResolvedValue({
      error: "Credenciais inválidas.",
      message: null,
    });

    const user = userEvent.setup();
    render(<AuthPage />);

    await user.type(screen.getByLabelText("Email"), "x@y.com");
    await user.type(screen.getByLabelText("Password"), "qualquerCoisa1");
    await user.click(screen.getByRole("button", { name: /submit sign in/i }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Credenciais inválidas.");
  });

  it("exibe mensagem de sucesso retornada por loginAction", async () => {
    loginActionSpy.mockResolvedValue({
      error: null,
      message: "Verifique seu e-mail para confirmar o acesso.",
    });

    const user = userEvent.setup();
    render(<AuthPage />);

    await user.type(screen.getByLabelText("Email"), "novo@example.com");
    await user.type(screen.getByLabelText("Password"), "outraSenha9");
    await user.click(screen.getByRole("button", { name: /submit sign in/i }));

    expect(
      await screen.findByText(
        "Verifique seu e-mail para confirmar o acesso.",
      ),
    ).toBeInTheDocument();
  });
});
