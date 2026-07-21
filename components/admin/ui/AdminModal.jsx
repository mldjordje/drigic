"use client";

import { useEffect, useId, useRef } from "react";
import { isTopAdminModal, registerAdminModal } from "./adminModalStack";

const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "area[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([type='hidden']):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']:not([tabindex='-1'])",
].join(",");

function isTabbable(element, container) {
  if (!(element instanceof HTMLElement) || (container && !container.contains(element))) return false;
  if (element.tabIndex < 0 || element.matches(":disabled") || element.matches("input[type='hidden']")) return false;
  for (let current = element; current instanceof HTMLElement; current = current.parentElement) {
    if (current.hidden || current.getAttribute("aria-hidden") === "true" || current.hasAttribute("inert")) return false;
    if (current.matches("fieldset[disabled]") || ["none", "hidden", "collapse"].includes(window.getComputedStyle(current).display) || ["hidden", "collapse"].includes(window.getComputedStyle(current).visibility)) return false;
  }
  return true;
}

function getFocusableElements(container) {
  return Array.from(container?.querySelectorAll(FOCUSABLE_SELECTOR) || []).filter(
    (element) => isTabbable(element, container)
  );
}

export default function AdminModal({
  open,
  onClose,
  title,
  description,
  initialFocusRef,
  dismissible = true,
  children,
}) {
  if (typeof title !== "string" || !title.trim()) throw new Error("AdminModal requires a non-empty title");

  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);
  const stackEntryRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initialFocusTarget = isTabbable(initialFocusRef?.current, dialogRef.current)
      ? initialFocusRef.current
      : (isTabbable(closeButtonRef.current, dialogRef.current) ? closeButtonRef.current : dialogRef.current);
    initialFocusTarget?.focus();

    const entry = {
      dialog: dialogRef.current,
      focus: () => (isTabbable(closeButtonRef.current, dialogRef.current) ? closeButtonRef.current : dialogRef.current)?.focus(),
      restoreFocus: () => {
        if (openerRef.current?.isConnected) openerRef.current.focus();
      },
    };
    stackEntryRef.current = entry;
    const unregister = registerAdminModal(entry);

    return () => {
      unregister();
      if (stackEntryRef.current === entry) stackEntryRef.current = null;
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  const handleKeyDown = (event) => {
    if (!isTopAdminModal(stackEntryRef.current)) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (dismissible) onClose?.();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements(dialogRef.current);
    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;
    if (!focusableElements.includes(activeElement)) {
      event.preventDefault();
      (event.shiftKey ? lastElement : firstElement).focus();
    } else if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const handleBackdropClick = (event) => {
    if (isTopAdminModal(stackEntryRef.current) && dismissible && event.target === event.currentTarget) onClose?.();
  };

  const handleClose = () => {
    if (isTopAdminModal(stackEntryRef.current)) onClose?.();
  };

  return (
    <div className="admin-modal-backdrop" data-testid="admin-modal-backdrop" onClick={handleBackdropClick}>
      <section
        ref={dialogRef}
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className="admin-modal__header">
          <div>
            <h2 id={titleId} className="admin-modal__title">{title}</h2>
            {description ? <p id={descriptionId} className="admin-modal__description">{description}</p> : null}
          </div>
          {dismissible ? (
            <button ref={closeButtonRef} className="admin-modal__close" type="button" onClick={handleClose} aria-label="Close dialog">
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </header>
        <div className="admin-modal__body">{children}</div>
      </section>
    </div>
  );
}
