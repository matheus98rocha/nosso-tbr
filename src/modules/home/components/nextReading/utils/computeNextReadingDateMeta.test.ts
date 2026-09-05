import { describe, expect, it } from "vitest";

import { DateUtils } from "@/utils/date";

import { computeNextReadingDateMeta } from "./computeNextReadingDateMeta";

const NOW = DateUtils.createLocalDate(2026, 3, 15);

describe("computeNextReadingDateMeta", () => {
  describe("RN67 / rótulos de atraso America/São_Paulo", () => {
    it("retorna nulls e strings vazias quando plannedStartDate é null", () => {
      const meta = computeNextReadingDateMeta(null, NOW);

      expect(meta.daysUntilStart).toBeNull();
      expect(meta.isStartOverdue).toBe(false);
      expect(meta.isToday).toBe(false);
      expect(meta.relativeLabel).toBe("");
      expect(meta.formattedStartDate).toBe("");
    });

    it("retorna nulls e strings vazias quando plannedStartDate é undefined", () => {
      const meta = computeNextReadingDateMeta(undefined, NOW);

      expect(meta.daysUntilStart).toBeNull();
      expect(meta.isStartOverdue).toBe(false);
      expect(meta.isToday).toBe(false);
      expect(meta.relativeLabel).toBe("");
      expect(meta.formattedStartDate).toBe("");
    });

    it("retorna nulls quando a data é inválida", () => {
      const meta = computeNextReadingDateMeta("não-é-data", NOW);

      expect(meta.daysUntilStart).toBeNull();
      expect(meta.isStartOverdue).toBe(false);
      expect(meta.isToday).toBe(false);
      expect(meta.relativeLabel).toBe("");
      expect(meta.formattedStartDate).toBe("");
    });

    it("marca hoje com daysUntilStart 0 e rótulo Hoje", () => {
      const meta = computeNextReadingDateMeta("2026-03-15", NOW);

      expect(meta.daysUntilStart).toBe(0);
      expect(meta.isStartOverdue).toBe(false);
      expect(meta.isToday).toBe(true);
      expect(meta.relativeLabel).toBe("Hoje");
      expect(meta.formattedStartDate.toLowerCase()).toMatch(/^15\s*(de\s*)?mar\.?$/);
    });

    it("calcula futuro em 3 dias", () => {
      const meta = computeNextReadingDateMeta("2026-03-18", NOW);

      expect(meta.daysUntilStart).toBe(3);
      expect(meta.isStartOverdue).toBe(false);
      expect(meta.isToday).toBe(false);
      expect(meta.relativeLabel).toBe("Em 3 dias");
      expect(meta.formattedStartDate.toLowerCase()).toMatch(/^18\s*(de\s*)?mar\.?$/);
    });

    it("calcula futuro em 1 dia no singular", () => {
      const meta = computeNextReadingDateMeta("2026-03-16", NOW);

      expect(meta.daysUntilStart).toBe(1);
      expect(meta.isStartOverdue).toBe(false);
      expect(meta.isToday).toBe(false);
      expect(meta.relativeLabel).toBe("Em 1 dia");
      expect(meta.formattedStartDate.toLowerCase()).toMatch(/^16\s*(de\s*)?mar\.?$/);
    });

    it("marca atrasado 1 dia", () => {
      const meta = computeNextReadingDateMeta("2026-03-14", NOW);

      expect(meta.daysUntilStart).toBe(-1);
      expect(meta.isStartOverdue).toBe(true);
      expect(meta.isToday).toBe(false);
      expect(meta.relativeLabel).toBe("Atrasado 1 dia");
      expect(meta.formattedStartDate.toLowerCase()).toMatch(/^14\s*(de\s*)?mar\.?$/);
    });

    it("marca atrasado N dias", () => {
      const meta = computeNextReadingDateMeta("2026-03-10", NOW);

      expect(meta.daysUntilStart).toBe(-5);
      expect(meta.isStartOverdue).toBe(true);
      expect(meta.isToday).toBe(false);
      expect(meta.relativeLabel).toBe("Atrasado 5 dias");
      expect(meta.formattedStartDate.toLowerCase()).toMatch(/^10\s*(de\s*)?mar\.?$/);
    });
  });
});
