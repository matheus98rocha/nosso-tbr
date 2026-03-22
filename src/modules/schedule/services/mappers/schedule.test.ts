import { ScheduleUpsertMapper } from "./schedule.mapper";

describe("ScheduleUpsertMapper", () => {
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
  });

  describe("#toPersistence", () => {
    it("joins chapters arrays and defaults completed to false", () => {
      const result = ScheduleUpsertMapper.toPersistence({
        book_id: "book-1",
        owner: "user-1",
        date: new Date("2025-10-17T15:00:00-03:00"),
        chapters: ["1", "2"] as unknown as string,
      });

      expect(result.chapters).toBe("1, 2");
      expect(result.completed).toBe(false);
      expect(result.book_id).toBe("book-1");
      expect(result.owner).toBe("user-1");
    });

    it("keeps string chapters and explicit completed flag", () => {
      const result = ScheduleUpsertMapper.toPersistence({
        book_id: "book-2",
        owner: "user-2",
        date: new Date("2025-10-18T15:00:00-03:00"),
        chapters: "3-4",
        completed: true,
      });

      expect(result.chapters).toBe("3-4");
      expect(result.completed).toBe(true);
    });
  });

  describe("#toDomain", () => {
    it("maps persistence data to domain format", () => {
      const result = ScheduleUpsertMapper.toDomain({
        id: "schedule-1",
        book_id: "book-1",
        owner: "user-1",
        date: "2025-10-17T00:00:00.000Z" as unknown as Date,
        chapters: "1-2",
        completed: true,
      });

      expect(result.id).toBe("schedule-1");
      expect(result.owner).toBe("user-1");
      expect(result.chapters).toBe("1-2");
      expect(result.completed).toBe(true);
      expect(result.date).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });
});
