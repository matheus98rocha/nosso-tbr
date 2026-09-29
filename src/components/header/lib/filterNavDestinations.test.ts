import { describe, expect, it } from "vitest";

import { NAV_DESTINATIONS } from "../constants/navCatalog";
import type { NavDestination } from "../types/navCatalog.types";
import { filterNavDestinations, selectBySurface } from "./filterNavDestinations";

function labels(destinations: { label: string }[]) {
  return destinations.map((destination) => destination.label);
}

describe("filterNavDestinations", () => {
  describe("visitante", () => {
    it("expõe Início, Estatisticas, Ver Estantes, Adicionar Estante e Login", () => {
      const visible = filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn: false,
        isAdmin: false,
      });

      expect(labels(visible)).toEqual([
        "Início",
        "Estatisticas",
        "Ver Estantes",
        "Adicionar Estante",
        "Login",
      ]);
    });

    it("oculta Comunidade, Perfil, Logout, Autores e Administração", () => {
      const visible = filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn: false,
        isAdmin: false,
      });
      const names = labels(visible);

      expect(names).not.toContain("Comunidade");
      expect(names).not.toContain("Perfil");
      expect(names).not.toContain("Logout");
      expect(names).not.toContain("Autores");
      expect(names).not.toContain("Administração");
    });
  });

  describe("common-user autenticado", () => {
    it("expõe Comunidade, Perfil e Logout e oculta Login", () => {
      const visible = filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn: true,
        isAdmin: false,
      });
      const names = labels(visible);

      expect(names).toContain("Comunidade");
      expect(names).toContain("Perfil");
      expect(names).toContain("Logout");
      expect(names).not.toContain("Login");
    });

    it("oculta Autores e Administração", () => {
      const visible = filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn: true,
        isAdmin: false,
      });
      const names = labels(visible);

      expect(names).not.toContain("Autores");
      expect(names).not.toContain("Administração");
    });
  });

  describe("admin", () => {
    it("expõe Autores e Administração", () => {
      const visible = filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn: true,
        isAdmin: true,
      });
      const names = labels(visible);

      expect(names).toContain("Autores");
      expect(names).toContain("Administração");
    });
  });
});

describe("selectBySurface", () => {
  describe("desktop", () => {
    it("lista Início, Estatisticas, Comunidade e Ver Estantes para common-user", () => {
      const visible = filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn: true,
        isAdmin: false,
      });

      expect(labels(selectBySurface(visible, "desktop"))).toEqual([
        "Início",
        "Estatisticas",
        "Comunidade",
        "Ver Estantes",
      ]);
    });

    it("inclui Autores e Administração no desktop quando o usuário é admin", () => {
      const visible = filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn: true,
        isAdmin: true,
      });

      expect(labels(selectBySurface(visible, "desktop"))).toEqual([
        "Início",
        "Estatisticas",
        "Comunidade",
        "Ver Estantes",
        "Autores",
        "Administração",
      ]);
    });

    it("nunca inclui Adicionar Estante, Perfil, Login nem Logout no desktop", () => {
      const guest = selectBySurface(
        filterNavDestinations(NAV_DESTINATIONS, {
          isLoggedIn: false,
          isAdmin: false,
        }),
        "desktop",
      );
      const commonUser = selectBySurface(
        filterNavDestinations(NAV_DESTINATIONS, {
          isLoggedIn: true,
          isAdmin: false,
        }),
        "desktop",
      );
      const admin = selectBySurface(
        filterNavDestinations(NAV_DESTINATIONS, {
          isLoggedIn: true,
          isAdmin: true,
        }),
        "desktop",
      );

      for (const names of [labels(guest), labels(commonUser), labels(admin)]) {
        expect(names).not.toContain("Adicionar Estante");
        expect(names).not.toContain("Perfil");
        expect(names).not.toContain("Login");
        expect(names).not.toContain("Logout");
      }
    });
  });

  describe("mobilePrimary", () => {
    it("lista as quatro destinações primárias quando autenticado", () => {
      const visible = filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn: true,
        isAdmin: false,
      });

      expect(labels(selectBySurface(visible, "mobilePrimary"))).toEqual([
        "Início",
        "Estatisticas",
        "Comunidade",
        "Ver Estantes",
      ]);
    });

    it("nunca inclui Autores nem Administração na barra primária", () => {
      const commonUser = labels(
        selectBySurface(
          filterNavDestinations(NAV_DESTINATIONS, {
            isLoggedIn: true,
            isAdmin: false,
          }),
          "mobilePrimary",
        ),
      );
      const admin = labels(
        selectBySurface(
          filterNavDestinations(NAV_DESTINATIONS, {
            isLoggedIn: true,
            isAdmin: true,
          }),
          "mobilePrimary",
        ),
      );

      for (const names of [commonUser, admin]) {
        expect(names).not.toContain("Autores");
        expect(names).not.toContain("Administração");
      }
    });
  });

  describe("mobileOverflow", () => {
    it("inclui Adicionar Estante, Perfil e Logout para common-user", () => {
      const visible = filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn: true,
        isAdmin: false,
      });
      const names = labels(selectBySurface(visible, "mobileOverflow"));

      expect(names).toContain("Adicionar Estante");
      expect(names).toContain("Perfil");
      expect(names).toContain("Logout");
      expect(names).not.toContain("Autores");
      expect(names).not.toContain("Administração");
    });

    it("inclui Autores e Administração no overflow do admin", () => {
      const visible = filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn: true,
        isAdmin: true,
      });
      const names = labels(selectBySurface(visible, "mobileOverflow"));

      expect(names).toContain("Adicionar Estante");
      expect(names).toContain("Perfil");
      expect(names).toContain("Logout");
      expect(names).toContain("Autores");
      expect(names).toContain("Administração");
    });
  });
});

describe("filterNavDestinations — flags isoladas", () => {
  const sample: NavDestination[] = [
    { label: "auth", requiresAuth: true, surfaces: ["desktop"] },
    { label: "admin", requiresAdmin: true, surfaces: ["desktop"] },
    { label: "guest-only", hideIfLoggedIn: true, surfaces: ["desktop"] },
    { label: "public", surfaces: ["desktop"] },
  ];

  it("aplica requiresAuth, requiresAdmin e hideIfLoggedIn de forma independente", () => {
    expect(
      labels(
        filterNavDestinations(sample, { isLoggedIn: false, isAdmin: false }),
      ),
    ).toEqual(["guest-only", "public"]);
    expect(
      labels(filterNavDestinations(sample, { isLoggedIn: true, isAdmin: false })),
    ).toEqual(["auth", "public"]);
    expect(
      labels(filterNavDestinations(sample, { isLoggedIn: true, isAdmin: true })),
    ).toEqual(["auth", "admin", "public"]);
  });
});
