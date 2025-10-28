"use client";
import { useEffect, useState } from "react";

type Insights = {
  month: string;
  todos: { completed: number; created: number };
  workouts: { count: number };
  diet: { calories: number; protein: number; carbs: number; fat: number };
  finance: { spent: number; topCategories: { name: string; amount: number; pct: number }[] };
};

function n(v: number) {
  return Intl.NumberFormat().format(Math.round(v));
}

export default function MonthlyInsights() {
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/insights/monthly", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    })();
  }, []);

  const month = data?.month ?? "";
  const top = data?.finance.topCategories ?? [];
  const top1 = top[0];

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold">Monthly insights</h3>
      <p className="text-sm text-zinc-600">{month || "—"}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-base-border)] bg-[var(--color-base-card)] p-4">
          <p className="text-xs text-zinc-500">To-dos completed</p>
          <p className="mt-1 text-2xl font-semibold">{data ? n(data.todos.completed) : "—"}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-base-border)] bg-[var(--color-base-card)] p-4">
          <p className="text-xs text-zinc-500">Workouts</p>
          <p className="mt-1 text-2xl font-semibold">{data ? n(data.workouts.count) : "—"}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-base-border)] bg-[var(--color-base-card)] p-4">
          <p className="text-xs text-zinc-500">Calories (MTD)</p>
          <p className="mt-1 text-2xl font-semibold">{data ? n(data.diet.calories) : "—"}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-base-border)] bg-[var(--color-base-card)] p-4">
          <p className="text-xs text-zinc-500">Top spend</p>
          <p className="mt-1 text-sm">
            {top1 ? <><span className="font-medium">{top1.name}</span> • R$ {n(top1.amount)} ({top1.pct.toFixed(0)}%)</> : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
