"use client";

import { JSX, useMemo, useState } from "react";
import useSWR from "swr";
import { AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import DeletableRow from "@/components/ui/DeletableRow";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FaTrash,
  FaPlus,
  FaXmark,
  FaSun,
  FaLeaf,
  FaMoon,
  FaCookie,
} from "react-icons/fa6";

type MealItem = {
  name: string;
  qty?: number;
  unit?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

type Meal = {
  _id: string;
  date: string; // "YYYY-MM-DD"
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  notes?: string;
  items: MealItem[];
};

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json());

// yyyy-mm
function formatMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// yyyy-mm-dd
function formatDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// paleta / ícone pra cada tipo de refeição
const typeStyles: Record<
  Meal["type"],
  { card: string; icon: JSX.Element; chip: string }
> = {
  Breakfast: {
    card:
      "bg-yellow-50 border-yellow-300 text-yellow-900 dark:bg-yellow-950/40 dark:border-yellow-600 dark:text-yellow-100",
    icon: <FaSun className="text-yellow-600 dark:text-yellow-300" />,
    chip:
      "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
  },
  Lunch: {
    card:
      "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-600 dark:text-emerald-100",
    icon: <FaLeaf className="text-emerald-600 dark:text-emerald-300" />,
    chip:
      "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100",
  },
  Dinner: {
    card:
      "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-600 dark:text-blue-100",
    icon: <FaMoon className="text-blue-600 dark:text-blue-300" />,
    chip:
      "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
  },
  Snack: {
    card:
      "bg-purple-50 border-purple-300 text-purple-900 dark:bg-purple-950/40 dark:border-purple-600 dark:text-purple-100",
    icon: <FaCookie className="text-purple-600 dark:text-purple-300" />,
    chip:
      "bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
  },
};

export default function DietPanel() {
  // mês que está carregado do backend
  const [month, setMonth] = useState(formatMonthKey(new Date()));
  // dia que queremos analisar no dashboard
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));

  // SWR principal (busca o mês inteiro)
  const {
    data: mealsData,
    isLoading,
    mutate,
  } = useSWR<Meal[]>(`/api/diet/meals?month=${month}`, fetcher, {
    revalidateOnFocus: true,
  });

  const meals = mealsData ?? [];

  // modal create meal
  const [open, setOpen] = useState(false);

  // form state para criar refeição
  const [date, setDate] = useState<string>(() => formatDateKey(new Date()));
  const [type, setType] = useState<Meal["type"]>("Breakfast");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<MealItem[]>([
    {
      name: "Chicken breast",
      qty: 150,
      unit: "g",
      calories: 240,
      protein: 45,
      carbs: 0,
      fat: 5,
    },
  ]);

  // ids que estão animando pra sumir
  const [exitingMealIds, setExitingMealIds] = useState<Set<string>>(
    new Set()
  );

  function resetForm() {
    const today = formatDateKey(new Date());
    setDate(today);
    setType("Breakfast");
    setNotes("");
    setItems([
      {
        name: "Chicken breast",
        qty: 150,
        unit: "g",
        calories: 240,
        protein: 45,
        carbs: 0,
        fat: 5,
      },
    ]);
  }

  // CREATE meal
  async function createMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) {
      alert("Add at least one item.");
      return;
    }

    const payload = {
      date,
      type,
      notes: notes || undefined,
      items,
    };

    const res = await fetch("/api/diet/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Failed to create meal", res.status);
      return;
    }

    setOpen(false);
    resetForm();

    // se eu criei refeição pro dia X, eu quero automaticamente
    // puxar o dashboard pra aquele mesmo dia
    setSelectedDate(date);

    mutate(); // refetch lista atualizada
  }

  // DELETE meal (optimistic)
  async function handleImmediateDelete(mealId: string) {
    // 1. marca como saindo pra dar o efeito vermelho + slide
    setExitingMealIds((prev) => {
      const next = new Set(prev);
      next.add(mealId);
      return next;
    });

    // 2. tira imediatamente do cache SWR (optimistic UI)
    mutate(
      (current) => {
        if (!current) return current;
        return current.filter((m) => m._id !== mealId);
      },
      { revalidate: false }
    );

    // 3. manda DELETE pro servidor
    const res = await fetch(`/api/diet/meals/${mealId}`, {
      method: "DELETE",
    });

    if (!res.ok && res.status !== 404) {
      console.error("Failed to delete meal", mealId, res.status);
    }

    // 4. refetch do servidor pra garantir estado final correto
    mutate();
  }

  // quando a animação termina
  function finalizeDeleteMeal(mealId: string) {
    setExitingMealIds((prev) => {
      const next = new Set(prev);
      next.delete(mealId);
      return next;
    });
  }

  // ===== itens do formulário do modal ======
  function addItem() {
    setItems((xs) => [
      ...xs,
      {
        name: "New item",
        qty: 100,
        unit: "g",
        calories: 100,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    ]);
  }
  function removeItem(idx: number) {
    setItems((xs) => xs.filter((_, i) => i !== idx));
  }

  // ===== agrupar tudo por dia (histórico mensal) =====
  const byDay = useMemo(() => {
    const map = new Map<string, Meal[]>();
    for (const m of meals) {
      const key = m.date; // já vem "YYYY-MM-DD"
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    // ordenar data desc
    return Array.from(map.entries()).sort((a, b) =>
      a[0] < b[0] ? 1 : -1
    );
  }, [meals]);

  // ===== refeições APENAS do dia selecionado =====
  const mealsOfSelectedDay = useMemo(() => {
    return meals.filter((m) => m.date === selectedDate);
  }, [meals, selectedDate]);

  // ===== totais do DIA selecionado =====
  const dayTotals = useMemo(() => {
    let calories = 0,
      protein = 0,
      carbs = 0,
      fat = 0;
    for (const m of mealsOfSelectedDay) {
      for (const it of m.items) {
        calories += it.calories || 0;
        protein += it.protein || 0;
        carbs += it.carbs || 0;
        fat += it.fat || 0;
      }
    }
    return { calories, protein, carbs, fat };
  }, [mealsOfSelectedDay]);

  // gráfico pizza também baseado só no dia
  const macrosData = useMemo(
    () => [
      {
        name: "Protein",
        value: Math.max(dayTotals.protein * 4, 0),
        color: "#10B981",
      },
      {
        name: "Carbs",
        value: Math.max(dayTotals.carbs * 4, 0),
        color: "#60A5FA",
      },
      {
        name: "Fat",
        value: Math.max(dayTotals.fat * 9, 0),
        color: "#F59E0B",
      },
    ],
    [dayTotals]
  );

  // totais por refeição
  function mealTotals(m: Meal) {
    return m.items.reduce(
      (acc, it) => ({
        calories: acc.calories + (it.calories || 0),
        protein: acc.protein + (it.protein || 0),
        carbs: acc.carbs + (it.carbs || 0),
        fat: acc.fat + (it.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  return (
    <div className="relative grid gap-6">
      {/* gradiente decorativo topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/40 to-transparent dark:from-white/5"></div>

      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn btn-primary cursor-pointer"
          onClick={() => setOpen(true)}
        >
          New meal
        </button>

        {/* seletor de DIA: controla o dashboard superior */}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <label className="label">Day</label>
          <input
            type="date"
            className="input !w-auto"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          {/* seletor de MÊS: controla o fetch */}
          <label className="label">Month</label>
          <input
            type="month"
            className="input !w-auto"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              // se o usuário troca mês, vamos também ajustar selectedDate
              // pra primeira data desse novo mês (qualquer heurística simples)
              const [y, m] = e.target.value.split("-");
              if (y && m) {
                setSelectedDate(`${y}-${m}-01`);
              }
            }}
          />
        </div>
      </div>

      {/* KPI cards do DIA selecionado */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Calories ({selectedDate})
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
            {Math.round(dayTotals.calories)} kcal
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Protein
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
            {Math.round(dayTotals.protein)} g
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Carbs
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
            {Math.round(dayTotals.carbs)} g
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Fat
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
            {Math.round(dayTotals.fat)} g
          </p>
        </div>
      </div>

      {/* Pie chart do DIA */}
      <div className="card p-4">
        <h3 className="mb-1 font-semibold text-zinc-900 dark:text-white">
          Macro calories distribution
        </h3>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          {selectedDate}
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie
                dataKey="value"
                data={macrosData}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {macrosData.map((entry, idx) => (
                  <Cell key={`m-${idx}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Histórico completo do mês (todas as datas) */}
      <div className="grid gap-4">
        {byDay.length === 0 && !isLoading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No meals for this month.
          </p>
        )}

        {byDay.map(([day, items]) => (
          <div key={day}>
            <p className="mb-2 flex items-baseline gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <span>{day}</span>

              {/* botão para "ver esse dia" nos KPIs */}
              <button
                className="rounded-md border border-zinc-300 bg-white px-2 py-[2px] text-[10px] font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 active:scale-[0.98] dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                onClick={() => setSelectedDate(day)}
              >
                Focus day
              </button>
            </p>

            <div className="grid gap-3">
              <AnimatePresence initial={false}>
                {items.map((m) => {
                  const exiting = exitingMealIds.has(m._id);
                  const t = mealTotals(m);
                  const style = typeStyles[m.type];

                  return (
                    <DeletableRow
                      key={m._id}
                      exiting={exiting}
                      onExitedAction={() => finalizeDeleteMeal(m._id)}
                      enableDrag
                      onDragDelete={() => handleImmediateDelete(m._id)}
                    >
                      <div
                        className={[
                          "rounded-xl border p-3 shadow-sm transition-all",
                          exiting
                            ? "bg-red-100 border-red-500 text-[var(--color-base-ink)] dark:bg-red-900/40 dark:border-red-600"
                            : style.card,
                          !exiting
                            ? "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                            : "",
                        ].join(" ")}
                      >
                        {/* header */}
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <span className="flex h-7 min-w-[2rem] items-center justify-center rounded-full px-2 text-xs font-medium shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                              <span
                                className={
                                  style.chip +
                                  " inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium leading-none"
                                }
                              >
                                {style.icon}
                                <span>{m.type}</span>
                              </span>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                            <span className="text-zinc-700 dark:text-zinc-200">
                              {Math.round(t.calories)} kcal
                            </span>
                            <span className="text-emerald-700 dark:text-emerald-300">
                              {Math.round(t.protein)}g P
                            </span>
                            <span className="text-blue-700 dark:text-blue-300">
                              {Math.round(t.carbs)}g C
                            </span>
                            <span className="text-amber-700 dark:text-amber-300">
                              {Math.round(t.fat)}g F
                            </span>

                            <button
                              className="text-red-600 transition-transform hover:scale-125 dark:text-red-400"
                              onClick={() => handleImmediateDelete(m._id)}
                              aria-label="Delete meal"
                              title="Delete meal"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        {/* notes */}
                        {m.notes && (
                          <p className="mb-2 text-sm italic text-zinc-700 dark:text-zinc-300">
                            {m.notes}
                          </p>
                        )}

                        {/* tabela itens */}
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[560px] text-left text-sm">
                            <thead>
                              <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-zinc-600 dark:border-white/10 dark:text-zinc-300">
                                <th className="py-2 pr-2 font-medium">
                                  Item
                                </th>
                                <th className="py-2 pr-2 font-medium">
                                  Qty
                                </th>
                                <th className="py-2 pr-2 font-medium">
                                  Kcal
                                </th>
                                <th className="py-2 pr-2 font-medium">
                                  Protein
                                </th>
                                <th className="py-2 pr-2 font-medium">
                                  Carbs
                                </th>
                                <th className="py-2 pr-2 font-medium">
                                  Fat
                                </th>
                              </tr>
                            </thead>
                            <tbody className="[&>tr:nth-child(even)]:bg-black/5 [&>tr:nth-child(even)]:dark:bg-white/5">
                              {m.items.map((it, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-black/5 text-zinc-800 dark:border-white/10 dark:text-zinc-100"
                                >
                                  <td className="py-2 pr-2">
                                    {it.name}
                                  </td>
                                  <td className="py-2 pr-2">
                                    {it.qty ?? "-"} {it.unit ?? ""}
                                  </td>
                                  <td className="py-2 pr-2">
                                    {Math.round(it.calories)} kcal
                                  </td>
                                  <td className="py-2 pr-2">
                                    {Math.round(it.protein ?? 0)} g
                                  </td>
                                  <td className="py-2 pr-2">
                                    {Math.round(it.carbs ?? 0)} g
                                  </td>
                                  <td className="py-2 pr-2">
                                    {Math.round(it.fat ?? 0)} g
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* total por refeição */}
                          <p className="mt-2 text-right text-xs font-medium text-zinc-800 dark:text-zinc-200">
                            Total:{" "}
                            <span className="font-semibold">
                              {Math.round(t.calories)} kcal
                            </span>
                          </p>
                        </div>
                      </div>
                    </DeletableRow>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {isLoading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading…
        </p>
      )}

      {/* Modal create meal */}
      <Modal
        open={open}
        closeAction={() => setOpen(false)}
        title="New meal"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost cursor-pointer"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary cursor-pointer"
              type="submit"
              form="create-meal-form"
            >
              Create
            </button>
          </>
        }
      >
        <form
          id="create-meal-form"
          className="grid gap-3"
          onSubmit={createMeal}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label>
              <div className="label">Type</div>
              <select
                className="input"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as Meal["type"])
                }
              >
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
              </select>
            </label>

            <label>
              <div className="label">Date</div>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>

            <label>
              <div className="label">Notes (optional)</div>
              <input
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </div>

          {/* Preview blocão */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
            <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
              Preview
            </p>
            {(() => {
              const t = items.reduce(
                (acc, it) => ({
                  calories: acc.calories + (it.calories || 0),
                  protein: acc.protein + (it.protein || 0),
                  carbs: acc.carbs + (it.carbs || 0),
                  fat: acc.fat + (it.fat || 0),
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
              );
              return (
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>
                    <strong>{Math.round(t.calories)}</strong>{" "}
                    kcal
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300">
                    <strong>{Math.round(t.protein)}</strong> g
                    protein
                  </span>
                  <span className="text-blue-700 dark:text-blue-300">
                    <strong>{Math.round(t.carbs)}</strong> g
                    carbs
                  </span>
                  <span className="text-amber-700 dark:text-amber-300">
                    <strong>{Math.round(t.fat)}</strong> g fat
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Items builder */}
          <div className="mt-1 grid gap-3">
            <div className="flex items-center justify-between">
              <p className="label">Items</p>
              <button
                type="button"
                className="btn btn-ghost cursor-pointer"
                onClick={addItem}
              >
                <FaPlus className="mr-1" /> Add item
              </button>
            </div>

            {items.map((it, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-200 dark:border-white/10"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-zinc-800/50">
                  <input
                    className="input !h-8 !py-1"
                    value={it.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setItems((xs) => {
                        const copy = structuredClone(
                          xs
                        ) as MealItem[];
                        copy[idx].name = v;
                        return copy;
                      });
                    }}
                    placeholder="Item name"
                    required
                  />
                  <button
                    type="button"
                    className="text-red-600 dark:text-red-400"
                    onClick={() => removeItem(idx)}
                  >
                    <FaXmark />
                  </button>
                </div>

                <div className="grid gap-2 p-3 md:grid-cols-6">
                  <label className="grid">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      Qty
                    </span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={it.qty ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setItems((xs) => {
                          const copy = structuredClone(
                            xs
                          ) as MealItem[];
                          copy[idx].qty =
                            v === "" ? undefined : Number(v);
                          return copy;
                        });
                      }}
                    />
                  </label>

                  <label className="grid">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      Unit
                    </span>
                    <input
                      className="input"
                      value={it.unit ?? "g"}
                      onChange={(e) => {
                        const v = e.target.value;
                        setItems((xs) => {
                          const copy = structuredClone(
                            xs
                          ) as MealItem[];
                          copy[idx].unit = v;
                          return copy;
                        });
                      }}
                    />
                  </label>

                  <label className="grid">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      Kcal
                    </span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={it.calories}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setItems((xs) => {
                          const copy = structuredClone(
                            xs
                          ) as MealItem[];
                          copy[idx].calories =
                            isNaN(n) || n < 0 ? 0 : n;
                          return copy;
                        });
                      }}
                      required
                    />
                  </label>

                  <label className="grid">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      Protein (g)
                    </span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={it.protein ?? 0}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setItems((xs) => {
                          const copy = structuredClone(
                            xs
                          ) as MealItem[];
                          copy[idx].protein =
                            isNaN(n) || n < 0 ? 0 : n;
                          return copy;
                        });
                      }}
                    />
                  </label>

                  <label className="grid">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      Carbs (g)
                    </span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={it.carbs ?? 0}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setItems((xs) => {
                          const copy = structuredClone(
                            xs
                          ) as MealItem[];
                          copy[idx].carbs =
                            isNaN(n) || n < 0 ? 0 : n;
                          return copy;
                        });
                      }}
                    />
                  </label>

                  <label className="grid">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      Fat (g)
                    </span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={it.fat ?? 0}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setItems((xs) => {
                          const copy = structuredClone(
                            xs
                          ) as MealItem[];
                          copy[idx].fat =
                            isNaN(n) || n < 0 ? 0 : n;
                          return copy;
                        });
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </form>
      </Modal>

      {isLoading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading…
        </p>
      )}
    </div>
  );
}
