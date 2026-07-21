import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AdminStatusMessage from "./AdminStatusMessage";

describe("AdminStatusMessage", () => {
  afterEach(cleanup);

  it.each([
    ["success", "status"],
    ["info", "status"],
    ["warning", "status"],
  ])("announces %s messages politely with a visible text cue", (tone, role) => {
    render(
      <AdminStatusMessage tone={tone} title="Saved">
        Your changes are available.
      </AdminStatusMessage>
    );

    const message = screen.getByRole(role);
    expect(message).toHaveTextContent(tone === "info" ? "Information" : tone[0].toUpperCase() + tone.slice(1));
    expect(message).toHaveTextContent("Saved");
    expect(message).toHaveTextContent("Your changes are available.");
    expect(message.querySelector("[aria-hidden='true']")).not.toBeNull();
  });

  it("uses an assertive alert for blocking errors", () => {
    render(<AdminStatusMessage tone="error">Please fix the highlighted fields.</AdminStatusMessage>);

    expect(screen.getByRole("alert")).toHaveTextContent("Error");
    expect(screen.getByRole("alert")).toHaveTextContent("Please fix the highlighted fields.");
  });
});
