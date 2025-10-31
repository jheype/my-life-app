"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FaFire, FaDumbbell, FaListCheck, FaWallet } from "react-icons/fa6";

function formatMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type WorkoutLite = {
  _id: string;
  date: string;
};

type InsightsData = {
  streak: number;
  weekActive: boolean[]; 
  workoutsThisMonth: number;
  tasksDoneThisMonth: number;
  expensesThisMonth: number;
};

export default function DashboardOverview() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const now = new Date();
      const monthKey = formatMonthKey(now);

      const res = await fetch(`/api/workouts?month=${monthKey}`, {
        cache: "no-store",
      });

      let workouts: WorkoutLite[] = [];
      if (res.ok) {
        workouts = await res.json();
      }

      const tasksDoneThisMonth = 0;
      const expensesThisMonth = 0;

      const datesWithWorkout = new Set(
        workouts.map((w) => new Date(w.date).toISOString().slice(0, 10))
      );

      let streakCount = 0;
      for (let i = 0; ; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (datesWithWorkout.has(key)) {
          streakCount++;
        } else {
          break;
        }
      }


      const today = new Date();
      const weekday = (today.getDay() + 6) % 7; 
      const weekActive: boolean[] = Array(7).fill(false);
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (weekday - i));
        const key = d.toISOString().slice(0, 10);
        if (datesWithWorkout.has(key)) {
          weekActive[i] = true;
        }
      }

      setInsights({
        streak: streakCount,
        weekActive,
        workoutsThisMonth: workouts.length,
        tasksDoneThisMonth: tasksDoneThisMonth,
        expensesThisMonth: expensesThisMonth,
      });

      setLoading(false);
    }

    load();
  }, []);

  const circles = useMemo(() => {
    if (!insights) return [];
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels.map((label, i) => {
      const active = insights.weekActive[i];
      return (
        <motion.div
          key={i}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            backgroundColor: active
              ? "var(--color-brand-500)"
              : "var(--color-base-card)",
            color: active
              ? "white"
              : "var(--color-base-ink)",
            borderColor: active
              ? "var(--color-brand-600)"
              : "var(--color-base-border)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-9 w-9 flex-col items-center justify-center rounded-full border text-[0.7rem] font-medium shadow-soft"
        >
          {label}
        </motion.div>
      );
    });
  }, [insights]);

  return (
    <div className="grid gap-6">
      {/* STREAK CARD */}
      <div className="card p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-semibold">
            <FaFire className="text-brand-500" />
            <span>Streak</span>
          </div>

          {!loading && insights && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold text-brand-600 dark:text-brand-400"
            >
              {insights.streak}d
            </motion.span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {circles}
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Consecutive active days. Completing at least one workout keeps the flame alive.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card p-4 flex flex-col gap-1"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <FaDumbbell />
            <span>Workouts this month</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--color-base-ink)] dark:text-white">
            {insights?.workoutsThisMonth ?? 0}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="card p-4 flex flex-col gap-1"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <FaListCheck />
            <span>Tasks done (soon)</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--color-base-ink)] dark:text-white">
            {insights?.tasksDoneThisMonth ?? 0}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-4 flex flex-col gap-1"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <FaWallet />
            <span>Spent this month</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--color-base-ink)] dark:text-white">
            ${insights?.expensesThisMonth?.toFixed
              ? insights.expensesThisMonth.toFixed(2)
              : "0.00"}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
