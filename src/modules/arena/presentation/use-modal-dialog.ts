/**
 * Native `<dialog>` modal lifecycle hook following Modern Web Guidance.
 * Opens via `showModal()`, resets `returnValue`, and provides `closedby="any"` fallback.
 */

import { type RefObject, useEffect } from 'react';

export interface ModalDialogHookOptions {
  readonly dialogRef: RefObject<HTMLDialogElement | null>;
  readonly isOpen: boolean;
  readonly lightDismiss?: boolean;
  readonly onDismiss: (returnValue: string) => void;
}

function isPointerOutsideDialog(event: PointerEvent, dialog: HTMLDialogElement): boolean {
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

function syncDialogOpenState(dialog: HTMLDialogElement, isOpen: boolean): void {
  if (isOpen && !dialog.open) {
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    return;
  }

  if (!isOpen && dialog.open) {
    closeDialogElement(dialog);
  }
}

function closeDialogElement(dialog: HTMLDialogElement): void {
  if (typeof dialog.close === 'function') {
    dialog.close();
    return;
  }
  dialog.removeAttribute('open');
  dialog.dispatchEvent(new Event('close'));
}

export function useNativeModalDialog(options: ModalDialogHookOptions): void {
  const { dialogRef, isOpen, lightDismiss = false, onDismiss } = options;

  // Synchronize imperative `showModal()` / `close()` with React state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog !== null) {
      syncDialogOpenState(dialog, isOpen);
    }
  }, [dialogRef, isOpen]);

  // Reset `dialog.returnValue` on close and wire progressive light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return undefined;
    }

    const handleClose = (): void => {
      const actionValue = dialog.returnValue;
      dialog.returnValue = '';
      onDismiss(actionValue);
    };

    dialog.addEventListener('close', handleClose);
    const cleanupLightDismiss = attachLightDismissFallback(dialog, lightDismiss);

    return () => {
      dialog.removeEventListener('close', handleClose);
      cleanupLightDismiss();
    };
  }, [dialogRef, lightDismiss, onDismiss]);
}

function attachLightDismissFallback(
  dialog: HTMLDialogElement,
  enabled: boolean,
): () => void {
  if (!enabled || 'closedBy' in HTMLDialogElement.prototype) {
    return () => {};
  }

  let pressedOutside = false;
  const onPointerDown = (event: PointerEvent): void => {
    pressedOutside = isPointerOutsideDialog(event, dialog);
  };
  const onPointerUp = (event: PointerEvent): void => {
    if (pressedOutside && isPointerOutsideDialog(event, dialog)) {
      closeDialogElement(dialog);
    }
    pressedOutside = false;
  };

  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('pointerup', onPointerUp);

  return () => {
    dialog.removeEventListener('pointerdown', onPointerDown);
    dialog.removeEventListener('pointerup', onPointerUp);
  };
}
