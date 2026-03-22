import { expect, test } from "@playwright/test";

test("happy path: tela de login renderiza campos e ações principais", async ({
  page,
}) => {
  await page.goto("/auth");

  await expect(page.getByText("Nosso TBR")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Esqueci a senha" }),
  ).toBeVisible();
});
