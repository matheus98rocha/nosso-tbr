import { describe, expect, it } from "vitest";
import {
  getScheduleBookQueryFilterKey,
  getScheduleQueryKey,
} from "./scheduleQueryKey";

describe("scheduleQueryKey", () => {
  it("getScheduleQueryKey inclui livro e usuário", () => {
    expect(getScheduleQueryKey("b1", "u1")).toEqual(["schedule", "b1", "u1"]);
  });

  it("getScheduleQueryKey aceita userId indefinido", () => {
    expect(getScheduleQueryKey("b1", undefined)).toEqual([
      "schedule",
      "b1",
      undefined,
    ]);
  });

  it("getScheduleBookQueryFilterKey é prefixo para invalidação", () => {
    expect(getScheduleBookQueryFilterKey("b1")).toEqual(["schedule", "b1"]);
  });
});
