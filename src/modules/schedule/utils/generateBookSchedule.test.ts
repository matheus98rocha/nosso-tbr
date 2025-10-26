import { generateBookSchedule } from "./generateBookSchedule";

describe("generateBookSchedule", () => {
  it("should generate a schedule correctly with deafult values", () => {
    const defaultInput = {
      chaptersPerDay: 2,
      days: undefined,
      includeEpilogue: false,
      includePrologue: false,
      includeWeekends: false,
      startDate: new Date("2025-10-16T21:00:00-03:00"),
      totalChapters: 10,
    };

    const defaultOutput = [
      { date: new Date("2025-10-16T12:00:00-03:00"), chapters: "1-2" },
      { date: new Date("2025-10-17T12:00:00-03:00"), chapters: "3-4" },
      { date: new Date("2025-10-20T12:00:00-03:00"), chapters: "5-6" },
      { date: new Date("2025-10-21T12:00:00-03:00"), chapters: "7-8" },
      { date: new Date("2025-10-22T12:00:00-03:00"), chapters: "9-10" },
    ];

    const result = generateBookSchedule(defaultInput);

    expect(result).toEqual(defaultOutput);
  });

  it("should generate a schedule correctly including weekends", () => {
    const defaultInput = {
      chaptersPerDay: 2,
      days: undefined,
      includeEpilogue: false,
      includePrologue: false,
      includeWeekends: true,
      startDate: new Date("2025-10-16T21:00:00-03:00"),
      totalChapters: 10,
    };

    const defaultOutput = [
      { date: new Date("2025-10-16T12:00:00-03:00"), chapters: "1-2" },
      { date: new Date("2025-10-17T12:00:00-03:00"), chapters: "3-4" },
      { date: new Date("2025-10-18T12:00:00-03:00"), chapters: "5-6" },
      { date: new Date("2025-10-19T12:00:00-03:00"), chapters: "7-8" },
      { date: new Date("2025-10-20T12:00:00-03:00"), chapters: "9-10" },
    ];

    const result = generateBookSchedule(defaultInput);

    expect(result).toEqual(defaultOutput);
  });

  it("should generate a schedule correctly with epilogue included", () => {
    const defaultInput = {
      chaptersPerDay: 2,
      days: undefined,
      includeEpilogue: true,
      includePrologue: false,
      includeWeekends: false,
      startDate: new Date("2025-10-16T21:00:00-03:00"),
      totalChapters: 10,
    };

    const defaultOutput = [
      { date: new Date("2025-10-16T12:00:00-03:00"), chapters: "1-2" },
      { date: new Date("2025-10-17T12:00:00-03:00"), chapters: "3-4" },
      { date: new Date("2025-10-20T12:00:00-03:00"), chapters: "5-6" },
      { date: new Date("2025-10-21T12:00:00-03:00"), chapters: "7-8" },
      {
        date: new Date("2025-10-22T12:00:00-03:00"),
        chapters: "9-10, Epílogo",
      },
    ];

    const result = generateBookSchedule(defaultInput);

    expect(result).toEqual(defaultOutput);
  });

  it("should generate a schedule correctly with prologue included", () => {
    const defaultInput = {
      chaptersPerDay: 2,
      days: undefined,
      includeEpilogue: false,
      includePrologue: true,
      includeWeekends: false,
      startDate: new Date("2025-10-16T21:00:00-03:00"),
      totalChapters: 10,
    };

    const defaultOutput = [
      { date: new Date("2025-10-16T12:00:00-03:00"), chapters: "Prólogo, 1-2" },
      { date: new Date("2025-10-17T12:00:00-03:00"), chapters: "3-4" },
      { date: new Date("2025-10-20T12:00:00-03:00"), chapters: "5-6" },
      { date: new Date("2025-10-21T12:00:00-03:00"), chapters: "7-8" },
      { date: new Date("2025-10-22T12:00:00-03:00"), chapters: "9-10" },
    ];

    const result = generateBookSchedule(defaultInput);

    expect(result).toEqual(defaultOutput);
  });

  it("should generate a schedule correctly with prologue and epilogue included", () => {
    const defaultInput = {
      chaptersPerDay: 2,
      days: undefined,
      includeEpilogue: true,
      includePrologue: true,
      includeWeekends: false,
      startDate: new Date("2025-10-16T21:00:00-03:00"),
      totalChapters: 10,
    };

    const defaultOutput = [
      { date: new Date("2025-10-16T12:00:00-03:00"), chapters: "Prólogo, 1-2" },
      { date: new Date("2025-10-17T12:00:00-03:00"), chapters: "3-4" },
      { date: new Date("2025-10-20T12:00:00-03:00"), chapters: "5-6" },
      { date: new Date("2025-10-21T12:00:00-03:00"), chapters: "7-8" },
      {
        date: new Date("2025-10-22T12:00:00-03:00"),
        chapters: "9-10, Epílogo",
      },
    ];

    const result = generateBookSchedule(defaultInput);

    expect(result).toEqual(defaultOutput);
  });

  it("should generate a schedule correctly with just one chapter per day", () => {
    const defaultInput = {
      chaptersPerDay: 1,
      includeEpilogue: false,
      includePrologue: false,
      includeWeekends: false,
      startDate: new Date("2025-10-17T12:00:00-03:00"),
      totalChapters: 3,
    };

    const defaultOutput = [
      { date: new Date("2025-10-17T12:00:00-03:00"), chapters: "1" },
      { date: new Date("2025-10-20T12:00:00-03:00"), chapters: "2" },
      { date: new Date("2025-10-21T12:00:00-03:00"), chapters: "3" },
    ];

    const result = generateBookSchedule(defaultInput);

    expect(result).toEqual(defaultOutput);
  });

  it("should generate a schedule correctly with first day is sunday", () => {
    const input = {
      chaptersPerDay: 2,
      includeEpilogue: false,
      includePrologue: false,
      includeWeekends: true,
      startDate: new Date("2025-08-10T21:00:00-03:00"),
      totalChapters: 6,
    };
    const expectedOutput = [
      { date: new Date("2025-08-10T12:00:00-03:00"), chapters: "1-2" },
      { date: new Date("2025-08-11T12:00:00-03:00"), chapters: "3-4" },
      { date: new Date("2025-08-12T12:00:00-03:00"), chapters: "5-6" },
    ];

    expect(generateBookSchedule(input)).toEqual(expectedOutput);
  });

  it("should generate a schedule correctly with first day is saturday", () => {
    const input = {
      chaptersPerDay: 2,
      includeEpilogue: false,
      includePrologue: false,
      includeWeekends: true,
      startDate: new Date("2025-08-09T21:00:00-03:00"),
      totalChapters: 6,
    };
    const expectedOutput = [
      { date: new Date("2025-08-09T12:00:00-03:00"), chapters: "1-2" },
      { date: new Date("2025-08-10T12:00:00-03:00"), chapters: "3-4" },
      { date: new Date("2025-08-11T12:00:00-03:00"), chapters: "5-6" },
    ];

    expect(generateBookSchedule(input)).toEqual(expectedOutput);
  });

  it("should not go back one day when using today's date as startDate", () => {
    const today = new Date();
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const schedule = generateBookSchedule({
      totalChapters: 6,
      startDate,
      includePrologue: false,
      includeEpilogue: true,
      chaptersPerDay: 3,
      includeWeekends: true,
    });

    const firstDate = schedule[0].date;
    expect(firstDate.getFullYear()).toBe(today.getFullYear());
    expect(firstDate.getMonth()).toBe(today.getMonth());
    expect(firstDate.getDate()).toBe(today.getDate());
  });
});
