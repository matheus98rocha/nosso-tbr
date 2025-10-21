import { ScheduleUpsertMapper } from "./schedule.mapper";

describe("generateBookSchedule", () => {
  describe("#formateScheduleDate", () => {
    it("should convert date to Brazilian midnight preserving the day", () => {
      const inputDate = new Date("2025-10-17T21:00:00-03:00");

      const result = ScheduleUpsertMapper.formateScheduleDate(inputDate);

      expect(result.getDate()).toBe(17);
      expect(result.getMonth()).toBe(9);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it("should handle dates near midnight correctly", () => {
      const inputDate = new Date("2025-10-17T23:59:59-03:00");

      const result = ScheduleUpsertMapper.formateScheduleDate(inputDate);

      expect(result.getDate()).toBe(17);
      expect(result.getHours()).toBe(0);
    });

    it("should handle dates at midnight correctly", () => {
      const inputDate = new Date("2025-10-17T00:00:00-03:00");

      const result = ScheduleUpsertMapper.formateScheduleDate(inputDate);

      expect(result.getDate()).toBe(17);
      expect(result.getHours()).toBe(0);
    });

    it("should handle string input", () => {
      const inputDate = "2025-10-17T21:00:00-03:00";

      const result = ScheduleUpsertMapper.formateScheduleDate(inputDate);

      expect(result.getDate()).toBe(17);
      expect(result.getMonth()).toBe(9);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getHours()).toBe(0);
    });

    it("should handle dates from different timezones", () => {
      const inputDate = new Date("2025-10-18T02:00:00Z");

      const result = ScheduleUpsertMapper.formateScheduleDate(inputDate);

      const brazilianHours = new Date(inputDate).toLocaleString("en-US", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        hour12: false,
      });

      if (parseInt(brazilianHours) < 24) {
        expect(result.getDate()).toBe(17);
      }
    });
  });
});
