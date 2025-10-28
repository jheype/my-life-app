"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type DayEntry = { date: string; active: boolean };
type Insights = {
  last7: DayEntry[];
  streak: number;
};

export default function StreakWidget() {
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/insights/monthly", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData({ last7: json.last7, streak: json.streak });
      }
    })();
  }, []);

  const days = data?.last7 ?? Array.from({ length: 7 }, (_, i) => ({ date: "", active: false }));
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Streak <span className="align-middle">🔥</span></h3>
        <p className="text-sm text-zinc-600">
          {typeof data?.streak === "number" ? `${data.streak} day${data.streak === 1 ? "" : "s"}` : "—"}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {days.map((d, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={[
              "grid h-9 w-9 place-items-center rounded-full border text-sm font-medium",
              d.active
                ? "bg-brand-600 text-white border-brand-700"
                : "bg-[var(--color-base-card)] text-[var(--color-base-ink)] border-[var(--color-base-border)]",
            ].join(" ")}
            title={d.date || ""}
          >
            {idx + 1}
          </motion.div>
        ))}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Each active day counts when you complete a task, log a meal, or a workout.
      </p>
    </div>
  );
}
