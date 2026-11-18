import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ReviewsTabs from "./reviewsTabs";

describe("ReviewsTabs", () => {
  it("marca a aba selecionada e troca ao clique", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ReviewsTabs value="geral" onChange={onChange} />);

    expect(screen.getByRole("tab", { name: "Geral" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.click(screen.getByRole("tab", { name: "Seguindo" }));
    expect(onChange).toHaveBeenCalledWith("seguindo");
  });
});
