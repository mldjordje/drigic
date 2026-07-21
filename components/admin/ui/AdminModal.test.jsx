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
});
