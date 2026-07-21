"use client";

import { useEffect, useId, useRef } from "react";

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

function getFocusableElements(container) {
  return Array.from(container?.querySelectorAll(FOCUSABLE_SELECTOR) || []).filter(
    (element) => element.tabIndex >= 0 && !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true"
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
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const initialFocusTarget = initialFocusRef?.current || closeButtonRef.current || dialogRef.current;
    initialFocusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (openerRef.current?.isConnected) openerRef.current.focus();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && dismissible) {
      event.stopPropagation();
      onClose?.();
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
    if (dismissible && event.target === event.currentTarget) onClose?.();
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
            <button ref={closeButtonRef} className="admin-modal__close" type="button" onClick={onClose} aria-label="Close dialog">
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </header>
        <div className="admin-modal__body">{children}</div>
      </section>
    </div>
  );
}
