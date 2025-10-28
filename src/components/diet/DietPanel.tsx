"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FaBurger, FaTrash, FaPlus, FaXmark } from "react-icons/fa6";

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
  date: string;
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  notes?: string;
  items: MealItem[];
};

function formatMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function DietPanel() {
  const [month, setMonth] = useState(formatMonthKey(new Date()));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<Meal["type"]>("Breakfast");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<MealItem[]>([
    { name: "Chicken breast", qty: 150, unit: "g", calories: 240, protein: 45, carbs: 0, fat: 5 },
  ]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/diet/meals?month=${month}`, { cache: "no-store" });
    if (res.ok) setMeals(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [month]);

  async function createMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) return alert("Add at least one item.");
    const res = await fetch("/api/diet/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        type,
        notes: notes || undefined,
        items,
      }),
    });
    if (res.ok) {
      setOpen(false);
      resetForm();
      load();
    }
  }

  function resetForm() {
    setDate(new Date().toISOString().slice(0,10));
    setType("Breakfast");
    setNotes("");
    setItems([{ name: "Chicken breast", qty: 150, unit: "g", calories: 240, protein: 45, carbs: 0, fat: 5 }]);
  }

  async function deleteMeal(id: string) {
    await fetch(`/api/diet/meals/${id}`, { method: "DELETE" });
    load();
  }

  function addItem() {
    setItems((xs) => [
      ...xs,
      { name: "New item", qty: 100, unit: "g", calories: 100, protein: 0, carbs: 0, fat: 0 },
    ]);
  }
  function removeItem(idx: number) {
    setItems((xs) => xs.filter((_, i) => i !== idx));
  }

  const totals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const m of meals) {
      for (const it of m.items) {
        calories += it.calories || 0;
        protein += it.protein || 0;
        carbs   += it.carbs   || 0;
        fat     += it.fat     || 0;
      }
    }
    return { calories, protein, carbs, fat };
  }, [meals]);

  const macrosData = useMemo(
    () => [
      { name: "Protein", value: Math.max(totals.protein * 4, 0), color: "#10B981" }, // 4 kcal/g
      { name: "Carbs",   value: Math.max(totals.carbs   * 4, 0), color: "#60A5FA" },
      { name: "Fat",     value: Math.max(totals.fat     * 9, 0), color: "#F59E0B" },
    ],
    [totals]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Meal[]>();
    for (const m of meals) {
      const key = new Date(m.date).toISOString().slice(0,10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).sort((a,b) => (a[0] < b[0] ? 1 : -1));
  }, [meals]);

  function mealTotals(m: Meal) {
    return m.items.reduce(
      (acc, it) => ({
        calories: acc.calories + (it.calories || 0),
        protein:  acc.protein  + (it.protein  || 0),
        carbs:    acc.carbs    + (it.carbs    || 0),
        fat:      acc.fat      + (it.fat      || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary cursor-pointer" onClick={() => setOpen(true)}>New meal</button>
        <div className="ml-auto flex items-center gap-2">
          <label className="label">Month</label>
          <input
            type="month"
            className="input !w-auto"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-zinc-600">Calories (month-to-date)</p>
          <p className="mt-1 text-2xl font-semibold">{Math.round(totals.calories)} kcal</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-600">Protein</p>
          <p className="mt-1 text-2xl font-semibold">{Math.round(totals.protein)} g</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-600">Carbs</p>
          <p className="mt-1 text-2xl font-semibold">{Math.round(totals.carbs)} g</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-600">Fat</p>
          <p className="mt-1 text-2xl font-semibold">{Math.round(totals.fat)} g</p>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-semibold">Macro calories distribution</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie dataKey="value" data={macrosData} innerRadius={60} outerRadius={90} paddingAngle={2}>
                {macrosData.map((entry, idx) => (
                  <Cell key={`m-${idx}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4">
        {byDay.length === 0 && <p className="text-sm text-zinc-500">No meals for this month.</p>}
        {byDay.map(([day, items]) => (
          <div key={day}>
            <p className="mb-2 text-sm font-medium text-zinc-600">{day}</p>
            <div className="grid gap-3">
              <AnimatePresence initial={false}>
                {items.map((m) => {
                  const t = mealTotals(m);
                  return (
                    <motion.div
                      key={m._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="rounded-xl border border-zinc-200 bg-white p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaBurger />
                          <p className="font-semibold">{m.type}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-zinc-700">{Math.round(t.calories)} kcal</span>
                          <span className="text-emerald-700">{Math.round(t.protein)}g P</span>
                          <span className="text-blue-700">{Math.round(t.carbs)}g C</span>
                          <span className="text-amber-700">{Math.round(t.fat)}g F</span>
                          <button className="text-red-600" onClick={() => deleteMeal(m._id)}>
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      {m.notes && <p className="mb-2 text-sm text-zinc-600">{m.notes}</p>}
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-zinc-200 text-zinc-500">
                              <th className="py-2 pr-2">Item</th>
                              <th className="py-2 pr-2">Qty</th>
                              <th className="py-2 pr-2">Kcal</th>
                              <th className="py-2 pr-2">Protein</th>
                              <th className="py-2 pr-2">Carbs</th>
                              <th className="py-2 pr-2">Fat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.items.map((it, i) => (
                              <tr key={i} className="border-b border-zinc-100">
                                <td className="py-2 pr-2">{it.name}</td>
                                <td className="py-2 pr-2">{it.qty ?? "-"} {it.unit ?? ""}</td>
                                <td className="py-2 pr-2">{Math.round(it.calories)} kcal</td>
                                <td className="py-2 pr-2">{Math.round(it.protein ?? 0)} g</td>
                                <td className="py-2 pr-2">{Math.round(it.carbs ?? 0)} g</td>
                                <td className="py-2 pr-2">{Math.round(it.fat ?? 0)} g</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}

      <Modal
        open={open}
        closeAction={() => setOpen(false)}
        title="New meal"
        footer={
          <>
            <button type="button" className="btn btn-ghost cursor-pointer" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary cursor-pointer" type="submit" form="create-meal-form">
              Create
            </button>
          </>
        }
      >
        <form id="create-meal-form" className="grid gap-3" onSubmit={createMeal}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label>
              <div className="label">Type</div>
              <select className="input" value={type} onChange={(e)=>setType(e.target.value as Meal["type"])}>
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
              </select>
            </label>
            <label>
              <div className="label">Date</div>
              <input className="input" type="date" value={date} onChange={(e)=>setDate(e.target.value)} required />
            </label>
            <label>
              <div className="label">Notes (optional)</div>
              <input className="input" value={notes} onChange={(e)=>setNotes(e.target.value)} />
            </label>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <p className="mb-2 text-sm text-zinc-500">Preview</p>
            {(() => {
              const t = items.reduce(
                (acc, it) => ({
                  calories: acc.calories + (it.calories || 0),
                  protein:  acc.protein  + (it.protein  || 0),
                  carbs:    acc.carbs    + (it.carbs    || 0),
                  fat:      acc.fat      + (it.fat      || 0),
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
              );
              return (
                <div className="flex flex-wrap gap-4 text-sm">
                  <span><strong>{Math.round(t.calories)}</strong> kcal</span>
                  <span className="text-emerald-700"><strong>{Math.round(t.protein)}</strong> g protein</span>
                  <span className="text-blue-700"><strong>{Math.round(t.carbs)}</strong> g carbs</span>
                  <span className="text-amber-700"><strong>{Math.round(t.fat)}</strong> g fat</span>
                </div>
              );
            })()}
          </div>

          {/* Items builder */}
          <div className="mt-1 grid gap-3">
            <div className="flex items-center justify-between">
              <p className="label">Items</p>
              <button type="button" className="btn btn-ghost cursor-pointer" onClick={addItem}>
                <FaPlus className="mr-1" /> Add item
              </button>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="rounded-xl border border-zinc-200">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2">
                  <input
                    className="input !h-8 !py-1"
                    value={it.name}
                    onChange={(e)=> {
                      const v = e.target.value;
                      setItems((xs)=> {
                        const copy = structuredClone(xs) as MealItem[];
                        copy[idx].name = v;
                        return copy;
                      });
                    }}
                    placeholder="Item name"
                    required
                  />
                  <button type="button" className="text-red-600" onClick={()=>removeItem(idx)}>
                    <FaXmark />
                  </button>
                </div>

                <div className="grid gap-2 p-3 md:grid-cols-6">
                  <label className="grid">
                    <span className="text-xs text-zinc-600">Qty</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={it.qty ?? ""}
                      onChange={(e)=> {
                        const v = e.target.value;
                        setItems((xs)=> {
                          const copy = structuredClone(xs) as MealItem[];
                          copy[idx].qty = v === "" ? undefined : Number(v);
                          return copy;
                        });
                      }}
                    />
                  </label>
                  <label className="grid">
                    <span className="text-xs text-zinc-600">Unit</span>
                    <input
                      className="input"
                      value={it.unit ?? "g"}
                      onChange={(e)=> {
                        const v = e.target.value;
                        setItems((xs)=> {
                          const copy = structuredClone(xs) as MealItem[];
                          copy[idx].unit = v;
                          return copy;
                        });
                      }}
                    />
                  </label>
                  <label className="grid">
                    <span className="text-xs text-zinc-600">Kcal</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={it.calories}
                      onChange={(e)=> {
                        const n = Number(e.target.value);
                        setItems((xs)=> {
                          const copy = structuredClone(xs) as MealItem[];
                          copy[idx].calories = isNaN(n) || n < 0 ? 0 : n;
                          return copy;
                        });
                      }}
                      required
                    />
                  </label>
                  <label className="grid">
                    <span className="text-xs text-zinc-600">Protein (g)</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={it.protein ?? 0}
                      onChange={(e)=> {
                        const n = Number(e.target.value);
                        setItems((xs)=> {
                          const copy = structuredClone(xs) as MealItem[];
                          copy[idx].protein = isNaN(n) || n < 0 ? 0 : n;
                          return copy;
                        });
                      }}
                    />
                  </label>
                  <label className="grid">
                    <span className="text-xs text-zinc-600">Carbs (g)</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={it.carbs ?? 0}
                      onChange={(e)=> {
                        const n = Number(e.target.value);
                        setItems((xs)=> {
                          const copy = structuredClone(xs) as MealItem[];
                          copy[idx].carbs = isNaN(n) || n < 0 ? 0 : n;
                          return copy;
                        });
                      }}
                    />
                  </label>
                  <label className="grid">
                    <span className="text-xs text-zinc-600">Fat (g)</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={it.fat ?? 0}
                      onChange={(e)=> {
                        const n = Number(e.target.value);
                        setItems((xs)=> {
                          const copy = structuredClone(xs) as MealItem[];
                          copy[idx].fat = isNaN(n) || n < 0 ? 0 : n;
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
    </div>
  );
}
