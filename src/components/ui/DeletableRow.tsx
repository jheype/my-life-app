"use client";

import {
  motion,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";
import { ReactNode } from "react";

export type DeletableRowProps = {
  children: ReactNode;
  exiting: boolean;
  onExitedAction: () => void;
  enableDrag?: boolean;
  onDragDelete?: () => void;
};

export default function DeletableRow({
  children,
  exiting,
  onExitedAction,
  enableDrag,
  onDragDelete,
}: DeletableRowProps) {
  const normalAnimate: TargetAndTransition = {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
  };

  const deleteAnimate: TargetAndTransition = {
    opacity: 0,
    x: -56,
    scale: 0.95,
  };

  const springTransition: Transition = {
    type: "spring",
    stiffness: 320,
    damping: 24,
    mass: 0.6,
  };

  const exitTransition: Transition = {
    duration: 0.28,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
  };

  function handleDragEnd(
    _: any,
    info: {
      offset: { x: number };
    }
  ) {
    if (!onDragDelete) return;
    const dx = info.offset.x;
    if (dx < -80) {
      onDragDelete();
    }
  }

  return (
    <motion.div
      layout="position"
      role="listitem"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={exiting ? deleteAnimate : normalAnimate}
      transition={exiting ? exitTransition : springTransition}
      onAnimationComplete={() => {
        if (exiting) onExitedAction();
      }}
      drag={enableDrag ? "x" : false}
      dragConstraints={enableDrag ? { left: 0, right: 0 } : undefined}
      onDragEnd={enableDrag ? handleDragEnd : undefined}
    >
      {children}
    </motion.div>
  );
}
