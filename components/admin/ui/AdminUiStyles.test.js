import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve(process.cwd(), "app/admin/admin-template.css"),
  "utf8"
);

describe("admin UI primitive styles", () => {
  it("uses selectors that outrank generic admin text colors for semantic status cues and modal descriptions", () => {
    expect(stylesheet).toMatch(/\.admin-template-root\s+\.admin-status-message\s+\.admin-status-message__(tone|title|icon)/);
    expect(stylesheet).toMatch(/\.admin-status-message__tone[\s\S]*?color:\s*var\(--admin-status-tone\)/);
    expect(stylesheet).toMatch(/\.admin-modal\s+\.admin-modal__description\s*\{[\s\S]*?color:\s*var\(--admin-color-muted,\s*#bcd0e8\)/);
  });
});
