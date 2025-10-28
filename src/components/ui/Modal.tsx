"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useEffect } from "react";

type ModalProps = {
  open: boolean;
  closeAction: () => void;
  title?: string;
  children: ReactNode;  
  footer?: ReactNode;    
};

export default function Modal({ open, closeAction, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAction();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeAction]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30" onClick={closeAction} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-soft
                       max-h-[85vh] flex flex-col"
          >
            {(title || true) && (
              <div className="flex items-center justify-between border-b border-zinc-200 p-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <button
                  className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
                  onClick={closeAction}
                  aria-label="Close"
                  title="Close"
                >
                  ×
                </button>
              </div>
            )}

            <div className="min-h-[120px] overflow-y-auto p-4">
              {children}
            </div>

            {footer && (
              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-zinc-200 bg-white p-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
