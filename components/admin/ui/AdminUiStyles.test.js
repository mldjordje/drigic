import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve(process.cwd(), "app/admin/admin-template.css"),
  "utf8"
);

describe("admin UI primitive styles", () => {
  it("uses selectors that outrank generic admin text colors for semantic status cues and modal descriptions", () => {
    expect(stylesheet).toContain(".admin-template-root .admin-status-message .admin-status-message__tone");
    expect(stylesheet).toContain(".admin-template-root .admin-status-message .admin-status-message__title");
    expect(stylesheet).toContain(".admin-template-root .admin-status-message .admin-status-message__icon");
    expect(stylesheet).toContain("color: var(--admin-status-tone);");
    expect(stylesheet).toContain(".admin-modal .admin-modal__description");
    expect(stylesheet).toContain("color: var(--admin-color-muted, #bcd0e8);");
  });
});
