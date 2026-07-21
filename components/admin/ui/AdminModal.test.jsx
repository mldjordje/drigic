import { createRef, useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminModal from "./AdminModal";

function ModalHarness({ dismissible = true, initialFocusRef, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open dialog</button>
      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit appointment"
        description="Update the appointment details."
        dismissible={dismissible}
        initialFocusRef={initialFocusRef}
      >
        {children}
      </AdminModal>
    </>
  );
}

describe("AdminModal", () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

  it("exposes its dialog name and description", async () => {
    const user = userEvent.setup();
    render(<ModalHarness><button type="button">Save</button></ModalHarness>);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    expect(screen.getByRole("dialog", { name: "Edit appointment", description: "Update the appointment details." })).toBeInTheDocument();
  });

  it("moves focus to the supplied initial focus target", async () => {
    const user = userEvent.setup();
    const inputRef = createRef();
    render(<ModalHarness initialFocusRef={inputRef}><input ref={inputRef} aria-label="Client name" /></ModalHarness>);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    expect(inputRef.current).toHaveFocus();
  });

  it("focuses the close control by default and wraps Tab in both directions", async () => {
    const user = userEvent.setup();
    render(<ModalHarness><button type="button">Save</button></ModalHarness>);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const closeButton = screen.getByRole("button", { name: "Close dialog" });
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(saveButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it("closes with Escape only when dismissible", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(<AdminModal open onClose={onClose} title="Edit appointment"><button type="button">Save</button></AdminModal>);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<AdminModal open onClose={onClose} title="Edit appointment" dismissible={false}><button type="button">Save</button></AdminModal>);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses from the backdrop but not from content when allowed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AdminModal open onClose={onClose} title="Edit appointment"><button type="button">Save</button></AdminModal>);

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("admin-modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss from the backdrop when dismissal is disabled", () => {
    const onClose = vi.fn();
    render(<AdminModal open onClose={onClose} title="Edit appointment" dismissible={false} />);

    fireEvent.click(screen.getByTestId("admin-modal-backdrop"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("locks body scroll and restores its exact previous value on close", () => {
    document.body.style.overflow = "scroll";
    const { rerender } = render(<AdminModal open onClose={vi.fn()} title="Edit appointment" />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<AdminModal open={false} onClose={vi.fn()} title="Edit appointment" />);
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("returns focus to the element that opened the modal", async () => {
    const user = userEvent.setup();
    render(<ModalHarness><button type="button">Save</button></ModalHarness>);
    const trigger = screen.getByRole("button", { name: "Open dialog" });

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(trigger).toHaveFocus();
  });

  it("safely retains focus on the dialog when there are no focusable children", async () => {
    const user = userEvent.setup();
    render(<ModalHarness dismissible={false}><p>Read-only details</p></ModalHarness>);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(dialog).toHaveFocus();
  });

  it("wraps Shift+Tab from a non-dismissible dialog to its last tabbable control", () => {
    render(
      <AdminModal open onClose={vi.fn()} title="Read-only appointment" dismissible={false}>
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </AdminModal>
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Last action" })).toHaveFocus();
  });

  it("moves Tab from a non-dismissible dialog to its first tabbable control", () => {
    render(
      <AdminModal open onClose={vi.fn()} title="Read-only appointment" dismissible={false}>
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </AdminModal>
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(screen.getByRole("button", { name: "First action" })).toHaveFocus();
  });

  it("excludes tabindex=-1 controls from the trap's tabbable order", () => {
    render(
      <AdminModal open onClose={vi.fn()} title="Read-only appointment" dismissible={false}>
        <button type="button" tabIndex={-1}>Programmatic action</button>
      </AdminModal>
    );

    const dialog = screen.getByRole("dialog");
    const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    dialog.dispatchEvent(tabEvent);
    expect(tabEvent.defaultPrevented).toBe(true);
    expect(dialog).toHaveFocus();
  });

  it("rejects a missing visible dialog title", () => {
    expect(() => render(<AdminModal open onClose={vi.fn()} title="  " />)).toThrow("AdminModal requires a non-empty title");
  });

  it("falls back to the close control when initialFocusRef points outside the dialog", () => {
    const externalRef = createRef();
    render(
      <>
        <button ref={externalRef} type="button">Outside</button>
        <AdminModal open onClose={vi.fn()} title="Edit appointment" initialFocusRef={externalRef} />
      </>
    );

    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
  });

  it("falls back to the close control when initialFocusRef is hidden or not tabbable", () => {
    const hiddenRef = createRef();
    render(
      <AdminModal open onClose={vi.fn()} title="Edit appointment" initialFocusRef={hiddenRef}>
        <button ref={hiddenRef} type="button" style={{ display: "none" }}>Hidden action</button>
      </AdminModal>
    );

    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
  });

  it("ignores controls hidden, inert, disabled, or non-tabbable through an ancestor", () => {
    render(
      <AdminModal open onClose={vi.fn()} title="Read-only appointment" dismissible={false}>
        <div hidden><button type="button">Hidden attribute</button></div>
        <div aria-hidden="true"><button type="button">Aria hidden</button></div>
        <div inert><button type="button">Inert action</button></div>
        <div style={{ display: "none" }}><button type="button">Display none</button></div>
        <div style={{ visibility: "hidden" }}><button type="button">Visibility hidden</button></div>
        <input type="hidden" aria-label="Hidden input" />
        <fieldset disabled><button type="button">Fieldset disabled</button></fieldset>
        <button type="button">Only tabbable action</button>
      </AdminModal>
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Only tabbable action" })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Only tabbable action" })).toHaveFocus();
  });

  it("keeps body locked and focus in the top modal when a lower sibling closes first", () => {
    document.body.style.overflow = "scroll";
    const firstClose = vi.fn();
    const secondClose = vi.fn();
    const { rerender } = render(
      <>
        <AdminModal open onClose={firstClose} title="First"><button type="button">First action</button></AdminModal>
        <AdminModal open onClose={secondClose} title="Second"><button type="button">Second action</button></AdminModal>
      </>
    );
    const topDialog = screen.getByRole("dialog", { name: "Second" });
    topDialog.focus();

    rerender(
      <>
        <AdminModal open={false} onClose={firstClose} title="First" />
        <AdminModal open onClose={secondClose} title="Second"><button type="button">Second action</button></AdminModal>
      </>
    );

    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("dialog", { name: "Second" })).toHaveFocus();

    rerender(<AdminModal open={false} onClose={secondClose} title="Second" />);
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("moves focus to the underlying modal when the top modal closes", () => {
    const { rerender } = render(
      <AdminModal open onClose={vi.fn()} title="Parent">
        <AdminModal open onClose={vi.fn()} title="Child" />
      </AdminModal>
    );

    rerender(
      <AdminModal open onClose={vi.fn()} title="Parent">
        <AdminModal open={false} onClose={vi.fn()} title="Child" />
      </AdminModal>
    );

    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
  });

  it("does not let Escape from a non-dismissible top child close its dismissible parent", () => {
    const parentClose = vi.fn();
    const childClose = vi.fn();
    render(
      <AdminModal open onClose={parentClose} title="Parent">
        <AdminModal open onClose={childClose} title="Child" dismissible={false} />
      </AdminModal>
    );

    fireEvent.keyDown(screen.getByRole("dialog", { name: "Child" }), { key: "Escape" });
    expect(childClose).not.toHaveBeenCalled();
    expect(parentClose).not.toHaveBeenCalled();
  });

  it("keeps initial focus and Shift+Tab inside an initially open nested child modal", () => {
    render(
      <AdminModal open onClose={vi.fn()} title="Parent">
        <AdminModal open onClose={vi.fn()} title="Child" />
      </AdminModal>
    );

    const childDialog = screen.getByRole("dialog", { name: "Child" });
    const childClose = childDialog.querySelector("button[aria-label='Close dialog']");
    expect(childClose).toHaveFocus();

    fireEvent.keyDown(childDialog, { key: "Tab", shiftKey: true });
    expect(childClose).toHaveFocus();
  });
});
