import { useCallback } from "react";

/**
 * Returns an onKeyDown handler that:
 * - ArrowDown → focus next focusable input/select/textarea/button inside `containerSelector`
 * - ArrowUp   → focus previous focusable input/select/textarea/button
 * - Escape    → call onEscape() if provided
 *
 * Usage:
 *   const arrowNav = useArrowNav({ containerSelector: "#my-form", onEscape: () => setOpen(false) });
 *   <input onKeyDown={arrowNav} ... />
 */

const FOCUSABLE = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])';

export function useArrowNav({
  containerSelector,
  onEscape,
  skipArrowOnDropdown = false,
}: {
  containerSelector: string;
  onEscape?: () => void;
  /** If true, ArrowDown/Up won't fire when the input has an open dropdown (data-dropdown-open="true") */
  skipArrowOnDropdown?: boolean;
}) {
  return useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }

      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

      // Skip if this input controls a dropdown that is open
      if (skipArrowOnDropdown) {
        const target = e.currentTarget as HTMLElement;
        if (target.getAttribute("data-dropdown-open") === "true") return;
      }

      const container = document.querySelector(containerSelector);
      if (!container) return;

      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => el.offsetParent !== null // visible only
      );

      const current = document.activeElement as HTMLElement;
      const idx = focusables.indexOf(current);
      if (idx === -1) return;

      e.preventDefault();

      if (e.key === "ArrowDown") {
        const next = focusables[idx + 1];
        if (next) { next.focus(); (next as HTMLInputElement).select?.(); }
      } else {
        const prev = focusables[idx - 1];
        if (prev) { prev.focus(); (prev as HTMLInputElement).select?.(); }
      }
    },
    [containerSelector, onEscape, skipArrowOnDropdown]
  );
}
