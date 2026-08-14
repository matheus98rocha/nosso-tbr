import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useErrorComponent } from "./useErrorComponent";

describe("useErrorComponent", () => {
  it("exposes onRefresh as a function", () => {
    const { result } = renderHook(() => useErrorComponent());

    expect(typeof result.current.onRefresh).toBe("function");
  });
});
