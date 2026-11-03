import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Save the trigger, move focus into the modal, restore on close.
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      if (first) first.focus();
    };
    // One tick, so children have rendered.
    const t = window.setTimeout(focusFirst, 0);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Esc to close, Tab to trap.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter(
        (el) =>
          !el.hasAttribute("disabled") &&
          el.offsetParent !== null
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-4 py-8 overflow-y-auto"
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-[1px] cursor-default"
        tabIndex={-1}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative bg-paper rounded-sm shadow-[0_20px_60px_-15px_rgba(15,18,20,0.25)] w-full max-w-lg p-6 sm:p-8
                   animate-[modal-rise_180ms_ease-out]"
      >
        <div className="flex items-start justify-between mb-6">
          <h2 className="font-editorial text-xl font-medium tracking-tight text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-quiet -mr-3 -mt-2 text-ink-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {children}
      </div>

      <style>{`
        @keyframes modal-rise {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[modal-rise_180ms_ease-out\\] {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}