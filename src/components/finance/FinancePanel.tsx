"use client";
import { useEffect, useMemo, useState } from "react";
import { ICONS, ICON_KEYS } from "./icons";
import IconPicker from "./IconPicker";
import ColorInput from "./ColorInput";
import Modal from "@/components/ui/Modal";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/** Types */
type Category = { _id: string; name: string; color: string; icon: string };
type Tx = {
  _id: string;
  categoryId: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  note?: string;
};

function formatMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FinancePanel() {
  // Month filter (default: current month)
  const [month, setMonth] = useState(formatMonthKey(new Date()));

  const [categories, setCategories] = useState<Category[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [catOpen, setCatOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);

  // New category form (with live preview)
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#10B981"); // brand-500 default
  const [catIcon, setCatIcon] = useState("shopping");

  // New transaction form
  const [txAmount, setTxAmount] = useState<number | "">("");
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txCategoryId, setTxCategoryId] = useState<string>("");
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [txNote, setTxNote] = useState("");

  async function loadAll() {
    setLoading(true);
    const [catsRes, txRes] = await Promise.all([
      fetch("/api/finance/categories", { cache: "no-store" }),
      fetch(`/api/finance/transactions?month=${month}`, { cache: "no-store" }),
    ]);
    if (catsRes.ok) setCategories(await catsRes.json());
    if (txRes.ok) setTxs(await txRes.json());
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [month]);

  /** Create category */
  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/finance/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName, color: catColor, icon: catIcon }),
    });
    if (res.ok) {
      setCatOpen(false);
      setCatName(""); setCatColor("#10B981"); setCatIcon("shopping");
      loadAll();
    }
  }

  /** Delete category (simple, not handling cascade; block if used) */
  async function deleteCategory(id: string) {
    const used = txs.some((t) => t.categoryId === id);
    if (used) {
      alert("This category has transactions. Remove them first.");
      return;
    }
    await fetch(`/api/finance/categories/${id}`, { method: "DELETE" });
    loadAll();
  }

  /** Create transaction */
  async function createTx(e: React.FormEvent) {
    e.preventDefault();
    if (!txCategoryId) return alert("Select a category.");
    const amount = typeof txAmount === "string" ? parseFloat(txAmount) : txAmount;
    if (!amount || amount <= 0) return alert("Invalid amount.");

    const res = await fetch("/api/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        type: txType,
        categoryId: txCategoryId,
        date: txDate,
        note: txNote || undefined,
      }),
    });
    if (res.ok) {
      setTxOpen(false);
      setTxAmount(""); setTxType("expense"); setTxCategoryId(""); setTxNote("");
      setTxDate(new Date().toISOString().slice(0,10));
      loadAll();
    }
  }

  /** Delete transaction */
  async function deleteTx(id: string) {
    await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" });
    loadAll();
  }

  // Derived data
  const totalExpense = useMemo(() => txs.filter(t => t.type === "expense").reduce((a,b)=>a+b.amount, 0), [txs]);
  const totalIncome  = useMemo(() => txs.filter(t => t.type === "income").reduce((a,b)=>a+b.amount, 0), [txs]);
  const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  // Group by category (expenses only) for pie
  const expenseByCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of txs) {
      if (t.type !== "expense") continue;
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    }
    return Object.entries(map).map(([categoryId, value]) => {
      const cat = categories.find(c => c._id === categoryId);
      return {
        name: cat ? cat.name : "Unknown",
        value,
        color: cat ? cat.color : "#e5e7eb",
      };
    });
  }, [txs, categories]);

  const txByDay = useMemo(() => {
    const map = new Map<string, Tx[]>();
    for (const t of txs) {
      const d = new Date(t.date);
      const key = d.toISOString().slice(0,10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort((a,b) => (a[0] < b[0] ? 1 : -1));
  }, [txs]);

  return (
    <div className="grid gap-6">
      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={() => setTxOpen(true)}>New transaction</button>
        <button className="btn btn-ghost" onClick={() => setCatOpen(true)}>New category</button>

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

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-zinc-600">Total expenses (month-to-date)</p>
          <p className="mt-1 text-2xl font-semibold">${totalExpense.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-600">Total income (month-to-date)</p>
          <p className="mt-1 text-2xl font-semibold">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-600">Balance (month-to-date)</p>
          <p className={`mt-1 text-2xl font-semibold ${balance < 0 ? "text-red-600" : "text-brand-700"}`}>
            ${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Pie chart of expenses */}
      <div className="card p-4">
        <h3 className="mb-3 font-semibold">Expenses by category</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie dataKey="value" data={expenseByCat} innerRadius={60} outerRadius={90} paddingAngle={2}>
                {expenseByCat.map((entry, idx) => (
                  <Cell key={`c-${idx}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Categories manager */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Categories</h3>
          <button className="btn btn-ghost" onClick={() => setCatOpen(true)}>Add</button>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = ICONS[c.icon] ?? ICONS.shopping;
            return (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: c.color }}>
                    <Icon className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-zinc-500">{c.icon} • {c.color}</p>
                  </div>
                </div>
                <button className="text-red-600" onClick={() => deleteCategory(c._id)}>Delete</button>
              </motion.div>
            );
          })}
          {!categories.length && <p className="text-sm text-zinc-500">No categories yet.</p>}
        </div>
      </div>

      {/* Transactions by day */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Transactions</h3>
          <button className="btn btn-ghost" onClick={() => setTxOpen(true)}>Add</button>
        </div>

        {txByDay.length === 0 && <p className="text-sm text-zinc-500">No transactions for this month.</p>}

        <div className="grid gap-4">
          {txByDay.map(([day, items]) => (
            <div key={day}>
              <p className="mb-2 text-sm font-medium text-zinc-600">{day}</p>
              <div className="grid gap-2">
                <AnimatePresence initial={false}>
                  {items.map((t) => {
                    const cat = categories.find(c => c._id === t.categoryId);
                    const Icon = cat ? (ICONS[cat.icon] ?? ICONS.shopping) : ICONS.shopping;
                    const color = cat?.color ?? "#e5e7eb";
                    return (
                      <motion.div
                        key={t._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: color }}>
                            <Icon className="text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{cat?.name ?? "Unknown"}</p>
                            {t.note && <p className="text-xs text-zinc-500">{t.note}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={t.type === "expense" ? "text-red-600" : "text-brand-700"}>
                            {t.type === "expense" ? "-" : "+"}${t.amount.toFixed(2)}
                          </span>
                          <button className="text-red-600" onClick={() => deleteTx(t._id)}>Delete</button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}

      {/* Category modal with live preview */}
      <Modal open={catOpen} closeAction={() => setCatOpen(false)} title="New category">
        <form className="grid gap-4" onSubmit={createCategory}>
          {/* Live preview card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <p className="mb-2 text-sm text-zinc-500">Preview</p>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ backgroundColor: catColor }}>
                {(ICONS[catIcon] ?? ICONS.shopping)({ className: "text-white" } as any)}
              </div>
              <div>
                <p className="font-medium">{catName || "Category name"}</p>
                <p className="text-xs text-zinc-500">{catIcon} • {catColor.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <label>
            <div className="label">Name</div>
            <input className="input" value={catName} onChange={(e)=>setCatName(e.target.value)} required />
          </label>

          {/* Color with improved preview */}
          <ColorInput value={catColor} changeAction={setCatColor} />

          {/* Icon visual picker */}
          <div className="grid gap-2">
            <div className="label">Icon</div>
            <IconPicker value={catIcon} changeAction={setCatIcon} />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost cursor-pointer" onClick={()=>setCatOpen(false)}>Cancel</button>
            <button className="btn btn-primary cursor-pointer" type="submit">Create</button>
          </div>
        </form>
      </Modal>

      {/* Transaction modal (sem mudanças visuais por enquanto) */}
      <Modal open={txOpen} closeAction={() => setTxOpen(false)} title="New transaction">
        <form className="grid gap-3" onSubmit={createTx}>
          <label>
            <div className="label">Amount</div>
            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              value={txAmount}
              onChange={(e)=>setTxAmount(e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
          </label>
          <label>
            <div className="label">Type</div>
            <select className="input" value={txType} onChange={(e)=>setTxType(e.target.value as any)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label>
            <div className="label">Category</div>
            <select className="input" value={txCategoryId} onChange={(e)=>setTxCategoryId(e.target.value)} required>
              <option value="">Select…</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label>
            <div className="label">Date</div>
            <input className="input" type="date" value={txDate} onChange={(e)=>setTxDate(e.target.value)} required />
          </label>
          <label>
            <div className="label">Note (optional)</div>
            <input className="input" value={txNote} onChange={(e)=>setTxNote(e.target.value)} />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={()=>setTxOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
