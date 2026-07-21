let modalStack = [];
let bodyOverflowBeforeLock = null;

export function registerAdminModal(entry) {
  if (modalStack.length === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  const containingEntryIndex = modalStack.findIndex((existingEntry) => entry.dialog?.contains(existingEntry.dialog));
  if (containingEntryIndex === -1) modalStack.push(entry);
  else modalStack.splice(containingEntryIndex, 0, entry);

  return () => {
    const index = modalStack.indexOf(entry);
    if (index === -1) return;
    const wasTop = index === modalStack.length - 1;
    modalStack.splice(index, 1);

    if (modalStack.length === 0) {
      document.body.style.overflow = bodyOverflowBeforeLock ?? "";
      bodyOverflowBeforeLock = null;
      entry.restoreFocus?.();
    } else if (wasTop) {
      modalStack[modalStack.length - 1].focus?.();
    }
  };
}

export function isTopAdminModal(entry) {
  return modalStack[modalStack.length - 1] === entry;
}
