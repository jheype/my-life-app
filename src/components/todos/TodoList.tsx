"use client";

import useSWR from "swr";
import { useState, useTransition } from "react";
import TodoItem from "./TodoItem";

type Todo = { _id: string; title: string; done: boolean };

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then(r => r.json());

export default function TodoList() {
  const { data: todos = [], isLoading, mutate } = useSWR<Todo[]>("/api/todos", fetcher, {
    revalidateOnFocus: true,
  });

  const [title, setTitle] = useState("");
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function requestDeleteAction(id: string) {
    setExitingIds(prev => new Set(prev).add(id));
  }

  async function onExitedAction(id: string) {
    startTransition(async () => {
      // otimista: tira da lista
      await mutate(curr => (curr ?? []).filter(t => t._id !== id), { revalidate: false });

      // backend
      await fetch(`/api/todos/${id}`, { method: "DELETE" });

      // limpa estado de saída
      setExitingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // revalida
      await mutate();
    });
  }

  function toggleAction(id: string) {
    const current = todos.find(t => t._id === id);
    if (!current) return;
    const nextDone = !current.done;

    startTransition(async () => {
      // otimista
      await mutate(curr => (curr ?? []).map(t => (
        t._id === id ? { ...t, done: nextDone } : t
      )), { revalidate: false });

      // backend
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: nextDone }),
      });

      // revalida
      await mutate();
    });
  }

  async function createAction(e: React.FormEvent) {
    e.preventDefault();
    const name = title.trim();
    if (!name) return;

    const tempId = "temp-" + Date.now();
    const optimistic: Todo = { _id: tempId, title: name, done: false };

    startTransition(async () => {
      // otimista
      await mutate([optimistic, ...todos], { revalidate: false, populateCache: true });
      setTitle("");

      // backend
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name }),
      });

      if (res.ok) {
        const created: Todo = await res.json();

        // costura: se backend não mandar done/title direito, fallback pro optimistic
        const safeCreated: Todo = {
          ...created,
          title: created.title ?? optimistic.title,
          done: typeof created.done === "boolean" ? created.done : optimistic.done,
        };

        await mutate(curr => {
          const list = (curr ?? []).filter(t => t._id !== tempId);
          return [safeCreated, ...list];
        }, false);

        await mutate();
      } else {
        await mutate(); // rollback
      }
    });
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={createAction} className="flex items-center gap-2">
        <input
          className="input"
          placeholder="Add a new task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn btn-primary" disabled={isPending} type="submit">
          {isPending ? "Adding…" : "Add"}
        </button>
      </form>

      {isLoading && <p className="text-sm text-zinc-500">Loading…</p>}

      <ul className="grid gap-2">
        {todos.map((t) => (
          <TodoItem
            key={t._id}
            id={t._id}
            title={t.title}
            done={t.done}
            exiting={exitingIds.has(t._id)}
            toggleAction={toggleAction}
            requestDeleteAction={requestDeleteAction}
            onExitedAction={onExitedAction}
          />
        ))}
      </ul>
    </div>
  );
}
