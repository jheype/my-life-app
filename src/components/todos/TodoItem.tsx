"use client";

import DeletableRow from "@/components/ui/DeletableRow";
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
  id,
  title,
  done,
  exiting,
  toggleAction,
  requestDeleteAction,
  onExitedAction,
}: Props) {
  const baseClass =
    "flex items-center justify-between rounded-xl border px-3 py-2 transition-colors";
  const stateClass = exiting
    ? "bg-red-100 border-red-500 text-[var(--color-base-ink)] dark:bg-red-900/40 dark:border-red-600"
    : done
    ? "bg-brand-50 border-brand-200 dark:bg-brand-900/30 dark:border-brand-700"
    : "bg-white border-zinc-200 dark:bg-[var(--color-base-card)] dark:border-[var(--color-base-border)]";

  return (
    <DeletableRow
      exiting={exiting}
      onExitedAction={() => onExitedAction(id)}
      enableDrag
      onDragDelete={() => requestDeleteAction(id)}
    >
      <li
        className={`${baseClass} ${stateClass}`}
      >
        <div className="flex items-center gap-2">
          <button
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
              done
                ? "bg-brand-600 text-white border-brand-700"
                : "bg-[var(--color-base-card)] text-[var(--color-base-ink)] border-[var(--color-base-border)]"
            }`}
            onClick={() => toggleAction(id)}
            aria-label={done ? "Mark as not completed" : "Mark as completed"}
            title={done ? "Mark as not completed" : "Mark as completed"}
          >
            <FaCheck className="text-xs" />
          </button>

          <span className={done ? "text-zinc-700 dark:text-brand-100" : ""}>
            {title}
          </span>
        </div>

        <button
          className="text-redbrand-300 hover:scale-110 transition"
          onClick={() => requestDeleteAction(id)}
          aria-label="Delete task"
          title="Delete task"
        >
          <FaTrash />
        </button>
      </li>
    </DeletableRow>
  );
}
