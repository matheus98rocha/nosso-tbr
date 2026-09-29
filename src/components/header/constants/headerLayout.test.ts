import { describe, expect, it } from "vitest";

import { BOTTOM_NAV_CLASS, DESKTOP_NAV_SLOT_CLASS, mainContentClassName } from "./headerLayout";

function tokens(className: string) {
  return className.split(/\s+/).filter(Boolean);
}

describe("headerLayout — contrato responsivo", () => {
  it("esconde a nav desktop abaixo de lg e exibe com lg:flex, sem flex solto", () => {
    const classes = tokens(DESKTOP_NAV_SLOT_CLASS);

    expect(classes).toContain("max-lg:hidden");
    expect(classes).toContain("lg:flex");
    expect(classes).not.toContain("flex");
    expect(classes).not.toContain("hidden");
    expect(classes).not.toContain("md:flex");
    expect(classes).not.toContain("max-md:hidden");
  });

  it("esconde a bottom nav a partir de lg e nunca com md:hidden", () => {
    const classes = tokens(BOTTOM_NAV_CLASS);

    expect(classes).toContain("lg:hidden");
    expect(classes).not.toContain("hidden");
    expect(classes).not.toContain("md:hidden");
  });

  it("reserva padding da bottom nav só com sessão", () => {
    expect(tokens(mainContentClassName(false))).toContain("pt-36");
    expect(tokens(mainContentClassName(false))).not.toContain("max-lg:pb-28");
    expect(tokens(mainContentClassName(true))).toContain("max-lg:pb-28");
    expect(tokens(mainContentClassName(true))).not.toContain("max-md:pb-28");
  });
});
