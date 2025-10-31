"use client";

import useSWR from "swr";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence } from "framer-motion";
import { ICONS } from "./icons";
import IconPicker from "./IconPicker";
import ColorInput from "./ColorInput";
import Modal from "@/components/ui/Modal";
import DeletableRow from "@/components/ui/DeletableRow";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FaTrash } from "react-icons/fa6";

type Category = { _id: string; name: string; color: string; icon: string };
type Tx = {
  _id: string;
  categoryId: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  note?: string;
};

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then(r => r.json());

function formatMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FinancePanel() {
  const [month, setMonth] = useState(formatMonthKey(new Date()));

  const { data: categories = [], mutate: mutateCats } = useSWR<Category[]>(
    "/api/finance/categories",
    fetcher,
    { revalidateOnFocus: true }
  );
  const { data: txs = [], isLoading, mutate: mutateTxs } = useSWR<Tx[]>(
    `/api/finance/transactions?month=${month}`,
    fetcher,
    { revalidateOnFocus: true }
  );

  const [catOpen, setCatOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);

  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#10B981");
  const [catIcon, setCatIcon] = useState("shopping");

  const [txAmount, setTxAmount] = useState<number | "">("");
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txCategoryId, setTxCategoryId] = useState<string>("");
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [txNote, setTxNote] = useState("");

  const [exitingCatIds, setExitingCatIds] = useState<Set<string>>(new Set());
  const [exitingTxIds, setExitingTxIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Create category (optimistic)
  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const tempId = "temp-" + Date.now();
    const optimistic: Category = { _id: tempId, name: catName, color: catColor, icon: catIcon };

    startTransition(async () => {
      await mutateCats([optimistic, ...categories], { revalidate: false, populateCache: true });

      const res = await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, color: catColor, icon: catIcon }),
      });

      if (res.ok) {
        const created: Category = await res.json();
        await mutateCats(curr => {
          const list = (curr ?? []).filter(c => c._id !== tempId);
          return [created, ...list];
        }, false);
        await mutateCats();
        setCatOpen(false);
        setCatName(""); setCatColor("#10B981"); setCatIcon("shopping");
      } else {
        await mutateCats(); // rollback
      }
    });
  }

  function requestDeleteCategory(id: string) {
    const used = txs.some(t => t.categoryId === id);
    if (used) {
      alert("This category has transactions. Remove them first.");
      return;
    }
    setExitingCatIds(prev => new Set(prev).add(id));
  }

  async function finalizeDeleteCategory(id: string) {
    startTransition(async () => {
      await fetch(`/api/finance/categories/${id}`, { method: "DELETE" });
      await mutateCats(curr => (curr ?? []).filter(c => c._id !== id), { revalidate: false });
      setExitingCatIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await mutateCats();
    });
  }

  // Create transaction (optimistic)
  async function createTx(e: React.FormEvent) {
    e.preventDefault();
    if (!txCategoryId) return alert("Select a category.");
    const amount = typeof txAmount === "string" ? parseFloat(txAmount) : txAmount;
    if (!amount || amount <= 0) return alert("Invalid amount.");

    const tempId = "temp-" + Date.now();
    const optimistic: Tx = {
      _id: tempId, categoryId: txCategoryId, type: txType, amount, date: txDate, note: txNote || undefined,
    };

    startTransition(async () => {
      await mutateTxs([optimistic, ...txs], { revalidate: false, populateCache: true });

      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimistic),
      });

      if (res.ok) {
        const created: Tx = await res.json();
        await mutateTxs(curr => {
          const list = (curr ?? []).filter(t => t._id !== tempId);
          return [created, ...list];
        }, false);
        await mutateTxs();
        setTxOpen(false);
        setTxAmount(""); setTxType("expense"); setTxCategoryId(""); setTxNote("");
        setTxDate(new Date().toISOString().slice(0, 10));
      } else {
        await mutateTxs(); // rollback
      }
    });
  }

  function requestDeleteTx(id: string) {
    setExitingTxIds(prev => new Set(prev).add(id));
  }

  async function finalizeDeleteTx(id: string) {
    startTransition(async () => {
      await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" });
      await mutateTxs(curr => (curr ?? []).filter(t => t._id !== id), { revalidate: false });
      setExitingTxIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await mutateTxs();
    });
  }

  const totalExpense = useMemo(
    () => txs.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0),
    [txs]
  );
  const totalIncome = useMemo(
    () => txs.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0),
    [txs]
  );
  const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const expenseByCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of txs) {
      if (t.type !== "expense") continue;
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    }
    return Object.entries(map).map(([categoryId, value]) => {
      const cat = categories.find(c => c._id === categoryId);
      return { name: cat ? cat.name : "Unknown", value, color: cat ? cat.color : "#e5e7eb" };
    });
  }, [txs, categories]);

  const txByDay = useMemo(() => {
    const map = new Map<string, Tx[]>();
    for (const t of txs) {
      const key = new Date(t.date).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [txs]);

  return (
    <div className="grid gap-6">
      {/* Actions */}
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
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Total expenses (month-to-date)</p>
          <p className="mt-1 text-2xl font-semibold">${totalExpense.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Total income (month-to-date)</p>
          <p className="mt-1 text-2xl font-semibold">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Balance (month-to-date)</p>
          <p className={`mt-1 text-2xl font-semibold ${balance < 0 ? "text-redbrand-300" : "text-brand-700 dark:text-brand-300"}`}>
            ${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Pie */}
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

      {/* Categories */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Categories</h3>
          <button className="btn btn-ghost" onClick={() => setCatOpen(true)}>Add</button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {categories.map((c) => {
              const Icon = ICONS[c.icon] ?? ICONS.shopping;
              const exiting = exitingCatIds.has(c._id);
              return (
                <DeletableRow
                  key={c._id}
                  exiting={exiting}
                  onExitedAction={() => finalizeDeleteCategory(c._id)}
                  enableDrag
                  onDragDelete={() => requestDeleteCategory(c._id)}
                >
                  <div
                    className={[
                      "flex items-center justify-between rounded-xl border p-3 transition-colors",
                      exiting
                        ? "bg-red-100 border-red-500 text-[var(--color-base-ink)] dark:bg-red-900/40 dark:border-red-600"
                        : "bg-[var(--color-base-card)] border-[var(--color-base-border)] text-[var(--color-base-ink)]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ backgroundColor: c.color }}>
                        <Icon className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.icon} • {c.color}</p>
                      </div>
                    </div>

                    <button
                      className="text-redbrand-300 hover:scale-110 transition"
                      onClick={() => requestDeleteCategory(c._id)}
                      aria-label="Delete category"
                      title="Delete category"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </DeletableRow>
              );
            })}
            {!categories.length && <div className="text-sm text-zinc-500 dark:text-zinc-400">No categories yet.</div>}
          </AnimatePresence>
        </div>
      </div>

      {/* Transactions */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Transactions</h3>
          <button className="btn btn-ghost" onClick={() => setTxOpen(true)}>Add</button>
        </div>

        {txByDay.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No transactions for this month.</p>}

        <div className="grid gap-4">
          {txByDay.map(([day, items]) => (
            <div key={day}>
              <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">{day}</p>
              <div className="grid gap-2">
                <AnimatePresence initial={false}>
                  {items.map((t) => {
                    const cat = categories.find(c => c._id === t.categoryId);
                    const Icon = cat ? (ICONS[cat.icon] ?? ICONS.shopping) : ICONS.shopping;
                    const color = cat?.color ?? "#e5e7eb";
                    const exiting = exitingTxIds.has(t._id);

                    return (
                      <DeletableRow
                        key={t._id}
                        exiting={exiting}
                        onExitedAction={() => finalizeDeleteTx(t._id)}
                        enableDrag
                        onDragDelete={() => requestDeleteTx(t._id)}
                      >
                        <div
                          className={[
                            "flex items-center justify-between rounded-xl border p-3 transition-colors",
                            exiting
                              ? "bg-red-100 border-red-500 text-[var(--color-base-ink)] dark:bg-red-900/40 dark:border-red-600"
                              : "bg-[var(--color-base-card)] border-[var(--color-base-border)] text-[var(--color-base-ink)]",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ backgroundColor: color }}>
                              <Icon className="text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{cat?.name ?? "Unknown"}</p>
                              {t.note && <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.note}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={
                                "text-sm font-semibold " +
                                (t.type === "expense" ? "text-redbrand-300" : "text-brand-700 dark:text-brand-300")
                              }
                            >
                              {t.type === "expense" ? "-" : "+"}${t.amount.toFixed(2)}
                            </span>

                            <button
                              className="text-redbrand-300 hover:scale-110 transition"
                              onClick={() => requestDeleteTx(t._id)}
                              aria-label="Delete transaction"
                              title="Delete transaction"
                            >
                              <FaTrash />
                            </button>
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
      </div>

      {isLoading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>}

      {/* Category modal */}
      <Modal open={catOpen} closeAction={() => setCatOpen(false)} title="New category">
        <form className="grid gap-4" onSubmit={createCategory}>
          <div className="rounded-xl border border-[var(--color-base-border)] bg-[var(--color-base-card)] p-3">
            <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">Preview</p>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: catColor }}>
                {(ICONS[catIcon] ?? ICONS.shopping)({ className: "text-white" } as any)}
              </div>
              <div>
                <p className="font-medium">{catName || "Category name"}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{catIcon} • {catColor.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <label>
            <div className="label">Name</div>
            <input className="input" value={catName} onChange={(e) => setCatName(e.target.value)} required />
          </label>

          <ColorInput value={catColor} changeAction={setCatColor} />

          <div className="grid gap-2">
            <div className="label">Icon</div>
            <IconPicker value={catIcon} changeAction={setCatIcon} />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost cursor-pointer" onClick={() => setCatOpen(false)}>Cancel</button>
            <button className="btn btn-primary cursor-pointer" type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transaction modal */}
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
              onChange={(e) => setTxAmount(e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
          </label>

          <label>
            <div className="label">Type</div>
            <select className="input" value={txType} onChange={(e) => setTxType(e.target.value as any)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>

          <label>
            <div className="label">Category</div>
            <select className="input" value={txCategoryId} onChange={(e) => setTxCategoryId(e.target.value)} required>
              <option value="">Select…</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>

          <label>
            <div className="label">Date</div>
            <input className="input" type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} required />
          </label>

          <label>
            <div className="label">Note (optional)</div>
            <input className="input" value={txNote} onChange={(e) => setTxNote(e.target.value)} />
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setTxOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
