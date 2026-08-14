import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CommunityMemberFollowRow from "./communityMemberFollowRow";

describe("CommunityMemberFollowRow", () => {
  it("dispara onPress ao clicar em Follow", async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <CommunityMemberFollowRow
        memberId="11111111-1111-4111-8111-111111111111"
        displayName="Ana"
        email="ana@mail.com"
        isFollowing={false}
        isToggleBusy={false}
        onPress={onPress}
      />,
    );
    await user.click(screen.getByRole("button", { name: /seguir ana/i }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
