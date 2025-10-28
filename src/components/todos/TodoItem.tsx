"use client";
import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import { FaTrash, FaCheck } from "react-icons/fa6";

type Props = {
  id: string;
  title: string;
  done: boolean;
  exiting: boolean;
  toggleAction: (id: string) => void;
  requestDeleteAction: (id: string) => void;
  onExitedAction: (id: string) => void;
};

export default function TodoItem({
  id, title, done, exiting,
  toggleAction, requestDeleteAction, onExitedAction,
}: Props) {
  const baseItem =
    "flex items-center justify-between rounded-xl border px-3 py-2 transition-colors";
  const normalItem =
    "bg-[var(--color-base-card)] border-[var(--color-base-border)] text-[var(--color-base-ink)]";
  const completedItem = [
    "bg-brand-100 border-brand-600 text-brand-800",
    "dark:bg-brand-800 dark:border-brand-700 dark:text-brand-100",
  ].join(" ");
  const exitingItem =
    "bg-red-100 border-red-500 text-[var(--color-base-ink)] dark:bg-red-900/40 dark:border-red-600";

  const normalAnimate: TargetAndTransition = { opacity: 1, y: 0, scale: 1 };
  const deleteAnimate: TargetAndTransition = { opacity: 0, x: -56, scale: 0.95 };

  const springTransition: Transition = { type: "spring", stiffness: 320, damping: 24, mass: 0.6 };
  const exitTransition: Transition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

  function onDragEnd(_: any, info: { offset: { x: number } }) {
    const dx = info.offset.x;
    if (dx > 80) toggleAction(id);         
    if (dx < -80) requestDeleteAction(id); 
  }

  return (
    <motion.li
      role="listitem"
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={exiting ? deleteAnimate : normalAnimate}
      transition={exiting ? exitTransition : springTransition}
      onAnimationComplete={() => { if (exiting) onExitedAction(id); }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      className={[
        baseItem,
        exiting ? exitingItem : done ? completedItem : normalItem,
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <button
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${done
            ? "bg-brand-600 text-white border-brand-700"
            : "bg-[var(--color-base-card)] text-[var(--color-base-ink)] border-[var(--color-base-border)]"}`}
          onClick={() => toggleAction(id)}
          aria-label={done ? "Mark as not completed" : "Mark as completed"}
          title={done ? "Mark as not completed" : "Mark as completed"}
        >
          <FaCheck className="text-xs" />
        </button>
        <span className="truncate">{title}</span>
      </div>

      <button
        className="text-redbrand-300 hover:scale-110 transition"
        onClick={() => requestDeleteAction(id)}
        aria-label="Delete task"
        title="Delete task"
      >
        <FaTrash />
      </button>
    </motion.li>
  );
}
