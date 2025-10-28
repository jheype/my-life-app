"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { FaDumbbell, FaTrash, FaCheck, FaPlus, FaXmark } from "react-icons/fa6";

/** Types mirrored from model (client-side) */
type SetItem = { reps: number; weight?: number; done?: boolean };
type Exercise = { name: string; notes?: string; sets: SetItem[] };
type Workout = {
  _id: string;
  date: string;
  title: string;
  notes?: string;
  exercises: Exercise[];
};

function formatMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function WorkoutPanel() {
  // Filter
  const [month, setMonth] = useState(formatMonthKey(new Date()));

  // Data
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [open, setOpen] = useState(false);

  // Form for new workout
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("Push day");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "Bench Press", notes: "", sets: [{ reps: 8, weight: 60 }, { reps: 8, weight: 60 }, { reps: 6, weight: 65 }] },
  ]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/workouts?month=${month}`, { cache: "no-store" });
    if (res.ok) setWorkouts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [month]);

  /** Create workout */
  async function createWorkout(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      date,
      title: title.trim(),
      notes: notes.trim() || undefined,
      exercises,
    };
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setOpen(false);
      resetForm();
      load();
    }
  }

  function resetForm() {
    setDate(new Date().toISOString().slice(0,10));
    setTitle("Push day");
    setNotes("");
    setExercises([{ name: "Bench Press", notes: "", sets: [{ reps: 8, weight: 60 }, { reps: 8, weight: 60 }, { reps: 6, weight: 65 }] }]);
  }

  /** Delete workout */
  async function deleteWorkout(id: string) {
    await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    load();
  }

  /** Toggle a set done (client-side, then PATCH whole exercises) */
  async function toggleSetDone(w: Workout, exIdx: number, setIdx: number) {
    const next = structuredClone(w.exercises) as Exercise[];
    next[exIdx].sets[setIdx].done = !next[exIdx].sets[setIdx].done;
    await fetch(`/api/workouts/${w._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercises: next }),
    });
    load();
  }

  /** Remove a set from an exercise */
  async function removeSet(w: Workout, exIdx: number, setIdx: number) {
    const next = structuredClone(w.exercises) as Exercise[];
    next[exIdx].sets.splice(setIdx, 1);
    await fetch(`/api/workouts/${w._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercises: next }),
    });
    load();
  }

  /** UI helpers to edit form arrays */
  function addExercise() {
    setExercises((xs) => [...xs, { name: "New exercise", notes: "", sets: [{ reps: 10 }] }]);
  }
  function removeExercise(idx: number) {
    setExercises((xs) => xs.filter((_, i) => i !== idx));
  }
  function addSet(idx: number) {
    setExercises((xs) => {
      const copy = structuredClone(xs) as Exercise[];
      copy[idx].sets.push({ reps: 10 });
      return copy;
    });
  }
  function removeSetFromForm(eIdx: number, sIdx: number) {
    setExercises((xs) => {
      const copy = structuredClone(xs) as Exercise[];
      copy[eIdx].sets.splice(sIdx, 1);
      return copy;
    });
  }

  // Group workouts by day
  const byDay = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of workouts) {
      const key = new Date(w.date).toISOString().slice(0,10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return Array.from(map.entries()).sort((a,b) => (a[0] < b[0] ? 1 : -1));
  }, [workouts]);

  return (
    <div className="grid gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          New workout
        </button>
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

      {/* List by day */}
      <div className="grid gap-4">
        {byDay.length === 0 && (
          <p className="text-sm text-zinc-500">No workouts for this month.</p>
        )}
        {byDay.map(([day, items]) => (
          <div key={day}>
            <p className="mb-2 text-sm font-medium text-zinc-600">{day}</p>
            <div className="grid gap-3">
              <AnimatePresence initial={false}>
                {items.map((w) => (
                  <motion.div
                    key={w._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="rounded-xl border border-[var(--color-base-border)] bg-[var(--color-base-card)] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaDumbbell />
                        <p className="font-semibold">{w.title}</p>
                      </div>
                      <button className="text-red-600" onClick={() => deleteWorkout(w._id)}>
                        <FaTrash />
                      </button>
                    </div>
                    {w.notes && <p className="mb-2 text-sm text-zinc-600">{w.notes}</p>}

                    {/* exercises */}
                    <div className="grid gap-3">
                      {w.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="rounded-lg border border-[var(--color-base-border)]">
                          <div className="flex items-center justify-between border-b border-[var(--color-base-border)] bg-[color-mix(in_ oklab, var(--color-base-card), var(--color-base-ink)_6%)] px-3 py-2">
                            <p className="font-medium">{ex.name}</p>
                            {ex.notes && <p className="text-xs text-zinc-500">{ex.notes}</p>}
                          </div>
                          <div className="p-3">
                            <div className="grid gap-2">
                              {ex.sets.map((s, sIdx) => {
                                const baseSet =
                                  "flex items-center justify-between rounded-md border px-3 py-2 transition-colors";
                                const pendingSet =
                                  "bg-[var(--color-base-card)] border-[var(--color-base-border)] text-[var(--color-base-ink)]";
                                const doneSet = [
                                  "bg-brand-100 border-brand-600 text-brand-800",
                                  "dark:bg-brand-800 dark:border-brand-700 dark:text-brand-100",
                                ].join(" ");
                                const toggleBase =
                                  "inline-flex h-6 w-6 items-center justify-center rounded-full border transition";
                                const toggleDone = "bg-brand-600 text-white border-brand-700";
                                const toggleIdle =
                                  "bg-[var(--color-base-card)] text-[var(--color-base-ink)] border-[var(--color-base-border)]";

                                return (
                                  <div
                                    key={sIdx}
                                    className={`${baseSet} ${s.done ? doneSet : pendingSet}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <button
                                        className={`${toggleBase} ${s.done ? toggleDone : toggleIdle}`}
                                        onClick={() => toggleSetDone(w, exIdx, sIdx)}
                                        aria-label="Toggle set done"
                                        title="Toggle set done"
                                      >
                                        <FaCheck className="text-xs" />
                                      </button>
                                      <span className="text-sm">
                                        {s.reps} reps{typeof s.weight === "number" ? ` • ${s.weight} kg` : ""}
                                      </span>
                                    </div>
                                    <button
                                      className="text-red-600"
                                      onClick={() => removeSet(w, exIdx, sIdx)}
                                    >
                                      <FaXmark />
                                    </button>
                                  </div>
                                );
                              })}
                              {!ex.sets.length && (
                                <p className="text-xs text-zinc-500">No sets yet.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}

      {/* Create workout modal */}
      <Modal
        open={open}
        closeAction={() => setOpen(false)}
        title="New workout"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" form="create-workout-form">Create</button>
          </>
        }
      >
        <form id="create-workout-form" className="grid gap-3" onSubmit={createWorkout}>
          <label>
            <div className="label">Title</div>
            <input className="input" value={title} onChange={(e)=>setTitle(e.target.value)} required />
          </label>
          <label>
            <div className="label">Date</div>
            <input className="input" type="date" value={date} onChange={(e)=>setDate(e.target.value)} required />
          </label>
          <label>
            <div className="label">Notes (optional)</div>
            <input className="input" value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </label>

          {/* Exercises builder */}
          <div className="mt-1 grid gap-3">
            <div className="flex items-center justify-between">
              <p className="label">Exercises</p>
              <button type="button" className="btn btn-ghost" onClick={addExercise}>
                <FaPlus className="mr-1" /> Add exercise
              </button>
            </div>

            {exercises.map((ex, exIdx) => (
              <div key={exIdx} className="rounded-xl border border-[var(--color-base-border)] bg-[var(--color-base-card)]">
                <div className="flex items-center justify-between border-b border-[var(--color-base-border)] bg-[color-mix(in_ oklab, var(--color-base-card), var(--color-base-ink)_6%)] px-3 py-2">
                  <input
                    className="input !h-8 !py-1"
                    value={ex.name}
                    onChange={(e)=> {
                      const v = e.target.value;
                      setExercises((xs)=> {
                        const copy = structuredClone(xs) as Exercise[];
                        copy[exIdx].name = v;
                        return copy;
                      });
                    }}
                    placeholder="Exercise name"
                    required
                  />
                  <button type="button" className="text-red-600" onClick={()=>removeExercise(exIdx)}>
                    <FaTrash />
                  </button>
                </div>
                <div className="grid gap-2 p-3">
                  <input
                    className="input"
                    placeholder="Notes (optional)"
                    value={ex.notes || ""}
                    onChange={(e)=> {
                      const v = e.target.value;
                      setExercises((xs)=> {
                        const copy = structuredClone(xs) as Exercise[];
                        copy[exIdx].notes = v;
                        return copy;
                      });
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-600">Sets</p>
                    <button type="button" className="btn btn-ghost" onClick={()=>addSet(exIdx)}>
                      <FaPlus className="mr-1" /> Add set
                    </button>
                  </div>

                  {ex.sets.map((s, sIdx) => (
                    <div key={sIdx} className="grid grid-cols-3 items-center gap-2">
                      <label className="grid">
                        <span className="text-xs text-zinc-600">Reps</span>
                        <input
                          className="input"
                          type="number"
                          min={1}
                          value={s.reps}
                          onChange={(e)=> {
                            const n = Number(e.target.value);
                            setExercises((xs)=> {
                              const copy = structuredClone(xs) as Exercise[];
                              copy[exIdx].sets[sIdx].reps = n > 0 ? n : 1;
                              return copy;
                            });
                          }}
                          required
                        />
                      </label>
                      <label className="grid">
                        <span className="text-xs text-zinc-600">Weight (kg)</span>
                        <input
                          className="input"
                          type="number"
                          min={0}
                          step={0.5}
                          value={typeof s.weight === "number" ? s.weight : ""}
                          onChange={(e)=> {
                            const v = e.target.value;
                            setExercises((xs)=> {
                              const copy = structuredClone(xs) as Exercise[];
                              copy[exIdx].sets[sIdx].weight = v === "" ? undefined : Number(v);
                              return copy;
                            });
                          }}
                        />
                      </label>
                      <div className="flex items-end justify-end">
                        <button type="button" className="text-red-600" onClick={()=>removeSetFromForm(exIdx, sIdx)}>
                          <FaXmark />
                        </button>
                      </div>
                    </div>
                  ))}

                  {!ex.sets.length && (
                    <p className="text-xs text-zinc-500">No sets yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </form>
      </Modal>
    </div>
  );
}
