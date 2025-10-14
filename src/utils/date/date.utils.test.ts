// src/utils/dateUtils.test.ts

import { describe, it, expect } from "vitest";
import { DateUtils } from "./date.utils";

describe("DateUtils", () => {
  describe("dateToISO", () => {
    it("should return the date in YYYY-MM-DD format", () => {
      const date = new Date("2024-05-15T10:00:00.000Z");
      expect(DateUtils.dateToISO(date)).toBe("2024-05-15");
    });

    it("should return an empty string for null input", () => {
      expect(DateUtils.dateToISO(null as unknown as Date)).toBe("");
    });

    it("should return an empty string for invalid Date object", () => {
      const invalidDate = new Date("invalid date string");
      expect(DateUtils.dateToISO(invalidDate)).toBe("");
    });

    it("should handle dates near month boundaries correctly", () => {
      const date = new Date("2024-02-29T10:00:00.000Z");
      expect(DateUtils.dateToISO(date)).toBe("2024-02-29");
    });
  });

  describe("ptBRToISO", () => {
    it("should convert DD/MM/YYYY to YYYY-MM-DD", () => {
      expect(DateUtils.ptBRToISO("31/12/2023")).toBe("2023-12-31");
    });

    it("should handle single digit day and month", () => {
      expect(DateUtils.ptBRToISO("1/1/2024")).toBe("2024-01-01");
    });

    it("should return the input if already in YYYY-MM-DD format", () => {
      expect(DateUtils.ptBRToISO("2025-01-20")).toBe("2025-01-20");
    });

    it("should return an empty string for null or empty input", () => {
      expect(DateUtils.ptBRToISO("")).toBe("");
      expect(DateUtils.ptBRToISO(null as unknown as string)).toBe("");
    });

    it("should return the original string if format is incorrect (missing parts)", () => {
      expect(DateUtils.ptBRToISO("31/12")).toBe("31/12");
    });

    it("should return the original string if any part is not a number", () => {
      expect(DateUtils.ptBRToISO("31/AB/2023")).toBe("31/AB/2023");
    });

    it("should return the original string on unexpected error (Line 36-37)", () => {
      expect(DateUtils.ptBRToISO("2023-12-31-extra")).toBe("2023-12-31-extra");
    });
  });

  describe("isoToPtBR", () => {
    it("should convert YYYY-MM-DD to DD/MM/YYYY", () => {
      expect(DateUtils.isoToPtBR("2024-06-15")).toBe("15/06/2024");
    });

    it("should handle single digit day and month with padding", () => {
      expect(DateUtils.isoToPtBR("2024-01-01")).toBe("01/01/2024");
    });

    it("should return the input if already in DD/MM/YYYY format", () => {
      expect(DateUtils.isoToPtBR("25/03/2025")).toBe("25/03/2025");
    });

    it("should return an empty string for null or empty input", () => {
      expect(DateUtils.isoToPtBR("")).toBe("");
      expect(DateUtils.isoToPtBR(null as unknown as string)).toBe("");
    });

    it("should return the original string if format is incorrect (missing parts)", () => {
      expect(DateUtils.isoToPtBR("2024-06")).toBe("2024-06");
    });

    it("should return the original string if any part is not a number", () => {
      expect(DateUtils.isoToPtBR("2024-AB-15")).toBe("2024-AB-15");
    });

    it("should return the original string on unexpected error (Line 66-67)", () => {
      expect(DateUtils.isoToPtBR("2024-01-01-extra")).toBe("01/01/2024");
    });
  });

  describe("toDate", () => {
    it("should return null for null or empty input", () => {
      expect(DateUtils.toDate(null)).toBeNull();
      expect(DateUtils.toDate(undefined)).toBeNull();
      expect(DateUtils.toDate("")).toBeNull();
    });

    it("should return the same Date object if a Date object is passed", () => {
      const date = new Date();
      expect(DateUtils.toDate(date)).toBe(date);
    });

    it("should convert a valid ISO string to a Date object", () => {
      const date = DateUtils.toDate("2024-10-25");
      expect(date).toBeInstanceOf(Date);
      expect(date!.getFullYear()).toBe(2024);
      expect(date!.getMonth()).toBe(9);
      expect(date!.getDate()).toBe(25);
    });

    it("should return null for an invalid date string", () => {
      expect(DateUtils.toDate("not a valid date")).toBeNull();
    });
  });

  describe("toISOString", () => {
    it("should convert a Date object to YYYY-MM-DD string", () => {
      const date = new Date("2023-11-01T10:00:00Z");
      expect(DateUtils.toISOString(date)).toBe("2023-11-01");
    });

    it("should convert a date string to YYYY-MM-DD string", () => {
      expect(DateUtils.toISOString("2023-11-01")).toBe("2023-11-01");
    });

    it("should return an empty string for null or undefined input", () => {
      expect(DateUtils.toISOString(null)).toBe("");
      expect(DateUtils.toISOString(undefined)).toBe("");
    });

    it("should return an empty string for an invalid date string", () => {
      expect(DateUtils.toISOString("invalid")).toBe("");
    });
  });

  describe("formatForDisplay", () => {
    it("should format an ISO string to DD/MM/YYYY (pt-BR)", () => {
      const formattedDate = DateUtils.formatForDisplay("2024-07-28");
      expect(formattedDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(formattedDate).toBe("28/07/2024");
    });

    it("should format a Date object to DD/MM/YYYY (pt-BR)", () => {
      const date = new Date(2025, 0, 1);
      expect(DateUtils.formatForDisplay(date)).toBe("01/01/2025");
    });

    it("should return an empty string for null or undefined input", () => {
      expect(DateUtils.formatForDisplay(null)).toBe("");
    });

    it("should return an empty string for an invalid date string", () => {
      expect(DateUtils.formatForDisplay("not a date")).toBe("");
    });
  });

  describe("isValid", () => {
    it("should return true for a valid date string", () => {
      expect(DateUtils.isValid("2024-01-01")).toBe(true);
    });

    it("should return true for a valid Date object", () => {
      expect(DateUtils.isValid(new Date())).toBe(true);
    });

    it("should return false for null, undefined, or empty string", () => {
      expect(DateUtils.isValid(null)).toBe(false);
      expect(DateUtils.isValid(undefined)).toBe(false);
      expect(DateUtils.isValid("")).toBe(false);
    });

    it("should return false for an invalid date string", () => {
      expect(DateUtils.isValid("not a date")).toBe(false);
    });

    it("should return false for an invalid Date object", () => {
      expect(DateUtils.isValid(new Date("invalid"))).toBe(false);
    });
  });

  describe("createLocalDate", () => {
    it("should create a Date object with the specified local year, month, and day", () => {
      const date = DateUtils.createLocalDate(2024, 5, 10);
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(4);
      expect(date.getDate()).toBe(10);
      expect(date.getHours()).toBe(12);
    });

    it("should handle month boundaries (January)", () => {
      const date = DateUtils.createLocalDate(2024, 1, 1);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });
  });

  describe("toDate", () => {
    it("should return null on unexpected error (Line 89-90)", () => {
      expect(
        DateUtils.toDate({ toString: () => "invalid" } as unknown as
          | string
          | Date)
      ).toBeNull();
    });
  });

  describe("toISOString", () => {
    it("should return empty string on unexpected error (Line 101-102)", () => {
      const dateMock = {
        toISOString: () => {
          throw new Error("mock error");
        },
      } as unknown as Date;
      expect(DateUtils.toISOString(dateMock)).toBe("");
    });
  });

  describe("formatForDisplay", () => {
    it("should return empty string on unexpected error (Line 118-119)", () => {
      const dateMock = {
        toLocaleDateString: () => {
          throw new Error("mock error");
        },
      } as unknown as Date;
      expect(DateUtils.formatForDisplay(dateMock)).toBe("");
    });
  });
});
