"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TodoItem from "./TodoItem";

export default function TodoList() {
  const [todos, setTodos] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  async function load() {
    const res = await fetch("/api/todos", { cache: "no-store" });
    if (res.ok) setTodos(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const v = title.trim();
    if (!v) return;
    setTitle("");

    const tempId = `temp-${Date.now()}`;
    setTodos((t) => [{ _id: tempId, title: v, done: false }, ...t]);

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: v }),
    });

    if (res.ok) {
      startTransition(load);
    } else {
      setTodos((t) => t.filter((x) => x._id !== tempId));
    }
  }

  async function toggleAction(id: string) {
    setTodos((t) => t.map((x) => (x._id === id ? { ...x, done: !x.done } : x)));
    const res = await fetch(`/api/todos/${id}`, { method: "PATCH" });
    if (!res.ok) startTransition(load);
  }

  function requestDeleteAction(id: string) {
    setExitingIds((prev) => new Set(prev).add(id));
  }

  async function onExitedAction(id: string) {
    setTodos((t) => t.filter((x) => x._id !== id));
    setExitingIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });

    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (!res.ok) startTransition(load);
  }

  const exitingMap = useMemo(() => {
    const map: Record<string, true> = {};
    exitingIds.forEach((id) => (map[id] = true));
    return map;
  }, [exitingIds]);

  return (
    <div className="card p-4">
      <form onSubmit={addTodo} className="mb-3 flex gap-2">
        <input
          className="input"
          placeholder="New task..."
          aria-label="New task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={pending}>
          Add
        </button>
      </form>

      <AnimatePresence initial={false} mode="popLayout">
        <motion.ul layout className="grid gap-2" role="list">
          {todos.map((t) => (
            <TodoItem
              key={t._id}
              id={t._id}
              title={t.title}
              done={t.done}
              exiting={!!exitingMap[t._id]}
              toggleAction={toggleAction}
              requestDeleteAction={requestDeleteAction}
              onExitedAction={onExitedAction}
            />
          ))}
        </motion.ul>
      </AnimatePresence>

      {!todos.length && (
        <p className="mt-2 text-sm text-zinc-500">No tasks yet. Add one above.</p>
      )}
    </div>
  );
}
