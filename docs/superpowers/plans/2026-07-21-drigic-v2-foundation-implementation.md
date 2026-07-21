# Dr Igić v2 — foundation and admin-shell implementation plan

**Design source:** `docs/superpowers/specs/2026-07-21-drigic-v2-product-incubator-design.md`  
**Branch:** `codex/drigic-v2-foundation`  
**Worktree:** `C:\Users\PC\.config\superpowers\worktrees\drigic\drigic-v2-foundation`

## Goal

Deliver the first low-risk, visible Dr Igić v2 increment: a reliable test foundation, trustworthy UTF-8 text, a grouped admin information architecture, accessible shared feedback/dialog primitives, and a responsive admin shell. Do not change booking rules, database schema, authentication policy, or introduce SaaS tenancy in this increment.

## Baseline

`npm run build` succeeds on 2026-07-21 with the production-like local environment. Existing warnings about React hook dependencies, raw `<img>` elements, Sass deprecation, and Edge-runtime `jose` APIs predate this plan and are not part of this increment unless a touched line directly causes a new warning.

## Global execution rules

- Execute tasks sequentially; do not run implementation agents in parallel.
- Each behavior change follows RED → GREEN → REFACTOR and records the failing and passing commands.
- Each task is committed independently.
- After each implementation commit, run a fresh spec-compliance review, then a separate code-quality review.
- Fix all Critical and Important review findings before moving to the next task.
- Preserve unrelated user files and existing untracked files.
- Use Serbian Latin text encoded as UTF-8.
- Do not add multi-tenant entities, billing, deposits, WhatsApp, or new clinical workflows.

## Task 1 — Test harness and source-encoding guard

### Files

- Modify: `package.json`
- Modify: `yarn.lock`
- Create: `vitest.config.mjs`
- Create: `tests/setup.js`
- Create: `lib/quality/source-encoding.js`
- Create: `lib/quality/source-encoding.test.js`
- Create: `scripts/check-source-encoding.mjs`

### Requirements

1. Add reproducible test dependencies using Yarn 1 through `npx -y yarn@1.22.22 add -D`: Vitest, jsdom, React Testing Library, jest-dom, and user-event. Do not commit `package-lock.json`.
2. Add scripts:
   - `test`: one-shot Vitest run;
   - `test:watch`: Vitest watch mode;
   - `check:utf8`: run the source-encoding CLI.
3. Configure jsdom, test setup, the existing `@/` alias, and jest-dom matchers.
4. Implement a small pure scanner that reports line/column and suspicious mojibake fragments without modifying files. It must recognize representative corrupt sequences such as `Dr IgiÄ‡`, `UÄŤitavanje`, `ZakaĹľi`, and `â†’`, while accepting correct Serbian text such as `Dr Igić`, `Učitavanje`, `Zakaži`, `Č`, `Ć`, `Š`, `Ž`, and `Đ`.
5. The CLI scans tracked source/content files under `app`, `components`, `lib`, `data`, and `README.md`, ignores generated/dependency directories, prints actionable `path:line:column` findings, and exits non-zero when findings exist.
6. The unit tests must cover clean Serbian, each representative corrupt family, multiple findings, and accurate locations.

### TDD sequence

1. Write the scanner tests against the desired API before creating `lib/quality/source-encoding.js`.
2. Run the focused test and capture the expected module-not-found RED failure.
3. Implement the minimum scanner and verify the focused test passes.
4. Add the CLI and configuration.
5. Run `npm test` and confirm green.
6. Run `npm run check:utf8`; it is expected to fail at this task because Task 2 repairs the repository. Record the finding count in the report, but do not weaken detection to make it pass.
7. Run `npm run build` and ensure no new build error.

### Acceptance

- Tests run reliably from a fresh install.
- Scanner behavior is tested and non-destructive.
- Existing corrupt text is surfaced with actionable locations.
- Build remains green.

## Task 2 — Repair active-source mojibake

### Files

- Modify only files reported by `npm run check:utf8` under `app`, `components`, `lib`, `data`, and `README.md`.
- Add or update focused assertions in `lib/quality/source-encoding.test.js` only if a previously unknown corrupt sequence requires a new detector.

### Requirements

1. Repair source text to real UTF-8 Serbian or intended symbols. Examples:
   - `Dr IgiÄ‡` → `Dr Igić`;
   - `UÄŤitavanje` → `Učitavanje`;
   - `ZakaĹľi` → `Zakaži`;
   - corrupt arrows → `→`.
2. Preserve the meaning of Serbian, English, German, and Italian copy. Do not translate or rewrite content beyond repairing encoding.
3. Do not make runtime decoding a product feature. Source files must contain correct characters directly.
4. If a mechanical conversion is used, inspect every changed file diff and ensure correct text was not damaged.

### TDD sequence

1. Run `npm run check:utf8` and capture the failing RED result.
2. Repair all reported active-source findings.
3. Run `npm run check:utf8` until it passes without exclusions for real source files.
4. Run `npm test` and `npm run build`.
5. Review the diff for semantic copy changes and accidental line-ending churn.

### Acceptance

- UTF-8 guard passes.
- Core public booking and admin text contains correct Serbian characters.
- No unrelated copy rewrite or broad formatting churn.
- Tests and build pass.

## Task 3 — Grouped admin navigation model

### Files

- Create: `lib/admin/navigation.js`
- Create: `lib/admin/navigation.test.js`
- Modify: `components/admin/AdminShell.jsx`
- Modify: `app/admin/page.jsx`
- Modify: `lib/i18n/index.js`

### Requirements

1. Extract a data-only admin navigation model with these ordered groups:
   - Danas: dashboard;
   - Kalendar i termini: calendar, bookings, morning slots, afternoon slots, Sunday availability;
   - Klijenti: clients and VIP requests;
   - Katalog: services, packages, products, promotions;
   - Sadržaj: media, blog, announcements;
   - Uvidi: analytics;
   - Podešavanja: settings;
   - Pomoć: tutorial and specification.
2. Export pure helpers that flatten navigation and resolve the active item from a pathname, including nested client routes and `/admin` mapping to the Today/dashboard destination.
3. Change the `/admin` root redirect from the calendar to `/admin/dashboard` so the route behavior matches the Today navigation model.
4. Remove permanently locked navigation placeholders. Keep locale switching and the public booking shortcut in a secondary utility area.
5. Render localized group labels and item labels. Add keys for supported dictionaries, using accurate Serbian and reasonable existing-language wording without restructuring the dictionary system.
6. The visible brand must be correctly encoded as `Dr Igić`.

### TDD sequence

1. Write tests for group order, unique hrefs, `/admin` resolution, exact matches, and nested-route resolution.
2. Verify RED because the module does not exist.
3. Implement the navigation model and helpers; verify focused tests green.
4. Refactor `AdminShell` to consume the model.
5. Run `npm test`, `npm run check:utf8`, and `npm run build`.

### Acceptance

- Navigation is task-oriented rather than a flat nineteen-link list.
- There are no disabled fake modules in primary navigation.
- Active title works on nested routes.
- Pure navigation behavior has tests.

## Task 4 — Accessible admin UI primitives

### Files

- Create: `components/admin/ui/AdminStatusMessage.jsx`
- Create: `components/admin/ui/AdminStatusMessage.test.jsx`
- Create: `components/admin/ui/AdminModal.jsx`
- Create: `components/admin/ui/AdminModal.test.jsx`
- Modify: `app/admin/admin-template.css`

### Requirements

1. `AdminStatusMessage` supports success, information, warning, and error. Success/information use a polite status announcement; blocking errors use an alert. Color is not the only cue.
2. `AdminModal` requires a visible title, supports an optional description, labels the dialog correctly, focuses a supplied initial control or the close control, traps Tab/Shift+Tab, closes on Escape when dismissal is allowed, locks background scroll, and restores focus to the trigger on close.
3. Modal backdrop click may dismiss only when allowed. Dismissal controls must be at least 44 × 44 px.
4. Add semantic CSS tokens for surface, text, muted text, borders, accent, success, warning, danger, focus, spacing, radii, elevation, and motion. Use them for the new primitives without rewriting every existing admin selector.
5. Add a global admin `:focus-visible` treatment and reduced-motion fallback.

### TDD sequence

1. Write behavior tests before components exist and verify RED.
2. Implement the minimum components and verify focused tests green.
3. Refactor and add CSS tokens after behavior is green.
4. Run all tests, UTF-8 guard, and build.

### Acceptance

- Keyboard focus cannot escape an open modal.
- Focus returns to the opener.
- Screen-reader roles and names are correct.
- Token and focus foundations exist for later pages.

## Task 5 — Responsive admin shell

### Files

- Modify: `components/admin/AdminShell.jsx`
- Create: `components/admin/AdminShell.test.jsx`
- Modify: `app/admin/admin-template.css`

### Requirements

1. Desktop uses the grouped sidebar from Task 3.
2. Mobile exposes five destinations: Danas, Kalendar, Klijenti, Termini, and Više. “Više” opens the grouped drawer for secondary destinations.
3. Mobile controls meet the 44 × 44 px minimum. The current location is conveyed semantically and visually.
4. Opening the drawer locks background scroll; Escape and backdrop close it; route change closes it. Reuse `AdminModal` or an equivalent accessible drawer pattern rather than duplicating focus logic.
5. Remove duplicate always-visible Calendar and Clients top-bar buttons. Keep notifications, locale/account utilities, and allow an optional page-specific primary action seam without implementing page actions yet.
6. Use breakpoints for phone (up to 767 px), tablet (768–1023 px), and desktop (1024 px and above). Reserve bottom space so content is not hidden by mobile navigation.

### TDD sequence

1. Add shell tests for grouped rendering, active destination, opening/closing More, Escape, and route-close behavior. Verify the new expectations fail first.
2. Implement shell behavior and responsive markup.
3. Add CSS and verify no layout-dependent behavior is hidden only by CSS.
4. Run all tests, UTF-8 guard, and build.

### Acceptance

- Primary admin destinations remain reachable at all target widths.
- No duplicate Calendar/Clients top-bar actions.
- Mobile navigation and drawer are keyboard/screen-reader operable.
- Main content reserves space for fixed navigation.

## Task 6 — Integrate shared feedback into bookings list

### Files

- Modify: `app/admin/bookings/page.jsx`
- Create: `app/admin/bookings/page.test.jsx` or extract and test a focused bookings-list component if direct page testing is too coupled.

### Requirements

1. Replace plain global success/error paragraphs with `AdminStatusMessage`.
2. Replace the single page-global mutation lock with per-booking pending state so updating one record does not disable every row.
3. The active row shows an accessible in-progress state; success/error feedback identifies the affected operation.
4. Preserve API contracts, filtering, status transitions, notes, and existing booking behavior.
5. Do not refactor the booking API in this task.

### TDD sequence

1. Add a failing interaction test proving one pending row does not disable another row and feedback has the correct role.
2. Implement the minimum state change.
3. Run focused tests, all tests, UTF-8 guard, and build.

### Acceptance

- Mutating one booking no longer freezes unrelated records.
- Feedback is accessible and operation-specific.
- Existing booking behavior and API payloads are unchanged.

## Final integration review

After all six tasks:

1. review the complete branch against the design specification;
2. run `npm test`, `npm run check:utf8`, and `npm run build`;
3. inspect `git diff main...HEAD` for scope creep and unrelated changes;
4. perform a mobile/desktop browser smoke check for `/admin/dashboard`, `/admin/kalendar`, `/admin/bookings`, and `/admin/klijenti` when authenticated access is available;
5. record known pre-existing warnings separately from new failures;
6. do not merge or deploy without the user's explicit final choice.
