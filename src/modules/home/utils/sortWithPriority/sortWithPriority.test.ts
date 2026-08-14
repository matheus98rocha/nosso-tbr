import { describe, expect, it } from "vitest";
import sortWithPriority from "./sortWithPriority";
describe("sortWithPriority", () => {
  it("should put the priority name first when it exists", () => {
    const result = sortWithPriority(
      [
        { id: "1", display_name: "Bruno" },
        { id: "2", display_name: "Carlos" },
        { id: "3", display_name: "Ana" },
        { id: "4", display_name: "Daniel" },
      ],
      "Bruno",
    );

    expect(result[0].display_name).toBe("Bruno");
  });

  it("should keep remaining items sorted alphabetically", () => {
    const result = sortWithPriority(
      [
        { id: "1", display_name: "Bruno" },
        { id: "2", display_name: "Carlos" },
        { id: "3", display_name: "Ana" },
        { id: "4", display_name: "Daniel" },
      ],
      "Bruno",
    );

    expect(result).toEqual([
      { id: "1", display_name: "Bruno" },
      { id: "3", display_name: "Ana" },
      { id: "2", display_name: "Carlos" },
      { id: "4", display_name: "Daniel" },
    ]);
  });

  it("should sort alphabetically if priority name does not exist", () => {
    const result = sortWithPriority(
      [
        { id: "1", display_name: "Bruno" },
        { id: "2", display_name: "Carlos" },
        { id: "3", display_name: "Ana" },
        { id: "4", display_name: "Daniel" },
      ],
      "Zeca",
    );

    expect(result).toEqual([
      { id: "3", display_name: "Ana" },
      { id: "1", display_name: "Bruno" },
      { id: "2", display_name: "Carlos" },
      { id: "4", display_name: "Daniel" },
    ]);
  });

  it("should be case insensitive", () => {
    const result = sortWithPriority(
      [
        { id: "1", display_name: "Bruno" },
        { id: "2", display_name: "Carlos" },
        { id: "3", display_name: "Ana" },
        { id: "4", display_name: "Daniel" },
      ],
      "bruno",
    );

    expect(result[0].display_name).toBe("Bruno");
  });

  it("should work with empty array", () => {
    const result = sortWithPriority([], "Bruno");

    expect(result).toEqual([]);
  });

  it("should handle array with one element", () => {
    const result = sortWithPriority([{ id: "1", display_name: "Ana" }], "Ana");

    expect(result).toEqual([{ id: "1", display_name: "Ana" }]);
  });
});
