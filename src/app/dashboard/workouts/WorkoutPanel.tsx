"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import DeletableRow from "@/components/ui/DeletableRow";
import {
  FaDumbbell,
  FaTrash,
  FaCheck,
  FaPlus,
  FaXmark,
} from "react-icons/fa6";

type SetItem = { reps: number; weight?: number; done?: boolean };
type Exercise = { name: string; notes?: string; sets: SetItem[] };
type Workout = {
  _id: string;
  date: string; 
  title: string;
  notes?: string;
  exercises?: Exercise[];
};

function formatMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function makeSetKey(workoutId: string, exIdx: number, setIdx: number) {
  return `${workoutId}:${exIdx}:${setIdx}`;
}

const fetcher = async (url: string) => {
  const r = await fetch(url, { cache: "no-store" });
  let data: any = null;
  try {
    data = await r.json();
  } catch {
    data = null;
  }
  if (!r.ok && !Array.isArray(data)) {
    throw new Error(`Request failed ${r.status}`);
  }
  return data;
};

export default function WorkoutPanel() {
  const [month, setMonth] = useState(formatMonthKey(new Date()));

  const [open, setOpen] = useState(false);

  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [title, setTitle] = useState("Push day");
  const [notes, setNotes] = useState("");
  const [exercisesForm, setExercisesForm] = useState<Exercise[]>([
    {
      name: "Bench Press",
      notes: "",
      sets: [
        { reps: 8, weight: 60 },
        { reps: 8, weight: 60 },
        { reps: 6, weight: 65 },
      ],
    },
  ]);

  const [exitingWorkoutIds, setExitingWorkoutIds] = useState<Set<string>>(
    new Set()
  );
  const [exitingSets, setExitingSets] = useState<Record<string, boolean>>({});
  const creatingRef = useRef(false);
  const deletedOnce = useRef<Set<string>>(new Set());
  const { data: workoutsData, isLoading } = useSWR<Workout[]>(
    `/api/workouts?month=${month}`,
    fetcher
  );
  const workouts = workoutsData ?? [];

  const byDay = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of workouts) {
      const key = w.date; 
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [workouts]);

  function resetForm() {
    setDate(new Date().toISOString().slice(0, 10));
    setTitle("Push day");
    setNotes("");
    setExercisesForm([
      {
        name: "Bench Press",
        notes: "",
        sets: [
          { reps: 8, weight: 60 },
          { reps: 8, weight: 60 },
          { reps: 6, weight: 65 },
        ],
      },
    ]);
  }

  function addExercise() {
    setExercisesForm((xs) => [
      ...xs,
      {
        name: "New exercise",
        notes: "",
        sets: [{ reps: 10 }],
      },
    ]);
  }

  function removeExercise(idx: number) {
    setExercisesForm((xs) => xs.filter((_, i) => i !== idx));
  }

  function addSet(idx: number) {
    setExercisesForm((xs) => {
      const copy = structuredClone(xs) as Exercise[];
      copy[idx].sets.push({ reps: 10 });
      return copy;
    });
  }

  function removeSetFromForm(exIdx: number, sIdx: number) {
    setExercisesForm((xs) => {
      const copy = structuredClone(xs) as Exercise[];
      copy[exIdx].sets.splice(sIdx, 1);
      return copy;
    });
  }

  async function createWorkout(e: React.FormEvent) {
    e.preventDefault();
    if (creatingRef.current) return;
    creatingRef.current = true;

    const payload = {
      date,
      title: title.trim(),
      notes: notes.trim() || undefined,
      exercises: exercisesForm,
    };

    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      creatingRef.current = false;
      console.error("Failed to create workout", res.status);
      return;
    }

    setOpen(false);
    resetForm();
    creatingRef.current = false;

    mutate(`/api/workouts?month=${month}`);
  }

  async function handleImmediateDelete(workoutId: string) {
    if (deletedOnce.current.has(workoutId)) return;

    setExitingWorkoutIds((prev) => {
      const next = new Set(prev);
      next.add(workoutId);
      return next;
    });

    const res = await fetch(`/api/workouts/${workoutId}`, {
      method: "DELETE",
    });

    if (!res.ok && res.status !== 404) {
      console.error("Failed to delete workout", workoutId, res.status);
    }

    deletedOnce.current.add(workoutId);

    mutate(`/api/workouts?month=${month}`);
  }

  function finalizeDeleteWorkout(workoutId: string) {
    setExitingWorkoutIds((prev) => {
      const next = new Set(prev);
      next.delete(workoutId);
      return next;
    });
  }

  function requestDeleteSet(workout: Workout, exIdx: number, setIdx: number) {
    const key = makeSetKey(workout._id, exIdx, setIdx);
    setExitingSets((prev) => ({ ...prev, [key]: true }));
  }

  async function finalizeDeleteSet(
    workout: Workout,
    exIdx: number,
    setIdx: number
  ) {
    const snapshotExercises = structuredClone(
      workout.exercises ?? []
    ) as Exercise[];

    if (!snapshotExercises.length) {
      console.warn("Abort PATCH: no exercises snapshot, avoiding wipe.");
      const kAbort = makeSetKey(workout._id, exIdx, setIdx);
      setExitingSets((prev) => {
        const { [kAbort]: _, ...rest } = prev;
        return rest;
      });
      mutate(`/api/workouts?month=${month}`);
      return;
    }

    if (snapshotExercises[exIdx]) {
      snapshotExercises[exIdx].sets.splice(setIdx, 1);
    }

    const res = await fetch(`/api/workouts/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: workout._id,
        exercises: snapshotExercises,
      }),
    });

    if (!res.ok) {
      console.error("PATCH (remove set) failed", res.status);
      const kErr = makeSetKey(workout._id, exIdx, setIdx);
      setExitingSets((prev) => {
        const { [kErr]: _, ...rest } = prev;
        return rest;
      });
      mutate(`/api/workouts?month=${month}`);
      return;
    }

    const k = makeSetKey(workout._id, exIdx, setIdx);
    setExitingSets((prev) => {
      const { [k]: _, ...rest } = prev;
      return rest;
    });

    mutate(`/api/workouts?month=${month}`);
  }

  async function toggleSetDone(
    workout: Workout,
    exIdx: number,
    setIdx: number
  ) {
    const snapshotExercises = structuredClone(
      workout.exercises ?? []
    ) as Exercise[];

    if (!snapshotExercises.length) {
      console.warn("Abort PATCH: no exercises snapshot, avoiding wipe.");
      return;
    }

    if (
      !snapshotExercises[exIdx] ||
      !snapshotExercises[exIdx].sets[setIdx]
    ) {
      console.warn("Abort PATCH: invalid index for toggle");
      return;
    }

    snapshotExercises[exIdx].sets[setIdx].done =
      !snapshotExercises[exIdx].sets[setIdx].done;

    const res = await fetch(`/api/workouts/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: workout._id,
        exercises: snapshotExercises,
      }),
    });

    if (!res.ok) {
      console.error("PATCH (toggle done) failed", res.status);
      return;
    }

    mutate(`/api/workouts?month=${month}`);
  }

  return (
    <div className="grid gap-6">
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
            onChange={(e) => {
              setMonth(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {byDay.length === 0 && !isLoading && (
          <p className="text-sm text-zinc-500">No workouts for this month.</p>
        )}

        {byDay.map(([day, items]) => (
          <div key={day}>
            <p className="mb-2 text-sm font-medium text-zinc-600">{day}</p>

            <div className="grid gap-3">
              <AnimatePresence initial={false}>
                {items.map((w) => {
                  const wExiting = exitingWorkoutIds.has(w._id);

                  return (
                    <DeletableRow
                      key={w._id}
                      exiting={wExiting}
                      onExitedAction={() => finalizeDeleteWorkout(w._id)}
                      enableDrag
                      onDragDelete={() => handleImmediateDelete(w._id)}
                    >
                      <div
                        className={[
                          "rounded-xl border p-3 transition-colors",
                          wExiting
                            ? "bg-red-100 border-red-500 text-[var(--color-base-ink)] dark:bg-red-900/40 dark:border-red-600"
                            : "border-[var(--color-base-border)] bg-[var(--color-base-card)] text-[var(--color-base-ink)]",
                        ].join(" ")}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaDumbbell />
                            <div className="flex flex-col">
                              <p className="font-semibold">{w.title}</p>
                              {w.notes && (
                                <p className="text-xs text-zinc-500">
                                  {w.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            className="text-red-600"
                            onClick={() => handleImmediateDelete(w._id)}
                            aria-label="Delete workout"
                            title="Delete workout"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div className="grid gap-3">
                          {(w.exercises ?? []).map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="rounded-lg border border-[var(--color-base-border)]"
                            >
                              <div className="flex flex-col gap-1 border-b border-[var(--color-base-border)] bg-[color-mix(in_ oklab, var(--color-base-card), var(--color-base-ink)_6%)] px-3 py-2 md:flex-row md:items-center md:justify-between">
                                <p className="font-medium">{ex.name}</p>
                                {ex.notes && (
                                  <p className="text-xs text-zinc-500">
                                    {ex.notes}
                                  </p>
                                )}
                              </div>

                              <div className="p-3">
                                <div className="grid gap-2">
                                  {(ex.sets ?? []).map((s, sIdx) => {
                                    const key = makeSetKey(
                                      w._id,
                                      exIdx,
                                      sIdx
                                    );
                                    const isExiting = !!exitingSets[key];

                                    const baseSet =
                                      "flex items-center justify-between rounded-md border px-3 py-2 transition-colors";
                                    const pendingSet =
                                      "bg-[var(--color-base-card)] border-[var(--color-base-border)] text-[var(--color-base-ink)]";
                                    const doneSet = [
                                      "bg-brand-100 border-brand-600 text-brand-800",
                                      "dark:bg-brand-800 dark:border-brand-700 dark:text-brand-100",
                                    ].join(" ");
                                    const exitingSet =
                                      "bg-red-100 border-red-500 text-[var(--color-base-ink)] dark:bg-red-900/40 dark:border-red-600";

                                    return (
                                      <DeletableRow
                                        key={key}
                                        exiting={isExiting}
                                        onExitedAction={() =>
                                          finalizeDeleteSet(
                                            w,
                                            exIdx,
                                            sIdx
                                          )
                                        }
                                        enableDrag
                                        onDragDelete={() =>
                                          requestDeleteSet(
                                            w,
                                            exIdx,
                                            sIdx
                                          )
                                        }
                                      >
                                        <div
                                          className={[
                                            baseSet,
                                            isExiting
                                              ? exitingSet
                                              : s.done
                                              ? doneSet
                                              : pendingSet,
                                          ].join(" ")}
                                        >
                                          <div className="flex items-center gap-3">
                                            <button
                                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
                                                s.done
                                                  ? "bg-brand-600 text-white border-brand-700"
                                                  : "bg-[var(--color-base-card)] text-[var(--color-base-ink)] border-[var(--color-base-border)]"
                                              }`}
                                              onClick={() =>
                                                toggleSetDone(
                                                  w,
                                                  exIdx,
                                                  sIdx
                                                )
                                              }
                                              aria-label="Toggle set done"
                                              title="Toggle set done"
                                            >
                                              <FaCheck className="text-xs" />
                                            </button>

                                            <span className="text-sm">
                                              {s.reps} reps
                                              {typeof s.weight === "number"
                                                ? ` • ${s.weight} kg`
                                                : ""}
                                            </span>
                                          </div>

                                          <button
                                            className="text-red-600"
                                            onClick={() =>
                                              requestDeleteSet(
                                                w,
                                                exIdx,
                                                sIdx
                                              )
                                            }
                                            aria-label="Delete set"
                                            title="Delete set"
                                          >
                                            <FaXmark />
                                          </button>
                                        </div>
                                      </DeletableRow>
                                    );
                                  })}

                                  {!(ex.sets ?? []).length && (
                                    <p className="text-xs text-zinc-500">
                                      No sets yet.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
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
        <p className="text-sm text-zinc-500">Loading…</p>
      )}

      <Modal
        open={open}
        closeAction={() => setOpen(false)}
        title="New workout"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              form="create-workout-form"
            >
              Create
            </button>
          </>
        }
      >
        <form
          id="create-workout-form"
          className="grid max-h-[70vh] gap-3 overflow-y-auto pr-2"
          onSubmit={createWorkout}
        >
          <label>
            <div className="label">Title</div>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
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

          <div className="mt-1 grid gap-3">
            <div className="flex items-center justify-between">
              <p className="label">Exercises</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={addExercise}
              >
                <FaPlus className="mr-1" /> Add exercise
              </button>
            </div>

            {exercisesForm.map((ex, exIdx) => (
              <div
                key={exIdx}
                className="rounded-xl border border-[var(--color-base-border)] bg-[var(--color-base-card)]"
              >
                <div className="flex items-center justify-between border-b border-[var(--color-base-border)] bg-[color-mix(in_ oklab, var(--color-base-card), var(--color-base-ink)_6%)] px-3 py-2">
                  <input
                    className="input !h-8 !py-1"
                    value={ex.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setExercisesForm((xs) => {
                        const copy = structuredClone(xs) as Exercise[];
                        copy[exIdx].name = v;
                        return copy;
                      });
                    }}
                    placeholder="Exercise name"
                    required
                  />
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={() => removeExercise(exIdx)}
                    aria-label="Remove exercise"
                    title="Remove exercise"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className="grid gap-2 p-3">
                  <input
                    className="input"
                    placeholder="Notes (optional)"
                    value={ex.notes || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setExercisesForm((xs) => {
                        const copy = structuredClone(xs) as Exercise[];
                        copy[exIdx].notes = v;
                        return copy;
                      });
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-600">Sets</p>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => addSet(exIdx)}
                    >
                      <FaPlus className="mr-1" /> Add set
                    </button>
                  </div>

                  {ex.sets.map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className="grid grid-cols-3 items-center gap-2"
                    >
                      <label className="grid">
                        <span className="text-xs text-zinc-600">Reps</span>
                        <input
                          className="input"
                          type="number"
                          min={1}
                          value={s.reps}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            setExercisesForm((xs) => {
                              const copy = structuredClone(
                                xs
                              ) as Exercise[];
                              copy[exIdx].sets[sIdx].reps =
                                n > 0 ? n : 1;
                              return copy;
                            });
                          }}
                          required
                        />
                      </label>

                      <label className="grid">
                        <span className="text-xs text-zinc-600">
                          Weight (kg)
                        </span>
                        <input
                          className="input"
                          type="number"
                          min={0}
                          step={0.5}
                          value={
                            typeof s.weight === "number"
                              ? s.weight
                              : ""
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            setExercisesForm((xs) => {
                              const copy = structuredClone(
                                xs
                              ) as Exercise[];
                              copy[exIdx].sets[sIdx].weight =
                                v === ""
                                  ? undefined
                                  : Number(v);
                              return copy;
                            });
                          }}
                        />
                      </label>

                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          className="text-red-600"
                          onClick={() =>
                            removeSetFromForm(exIdx, sIdx)
                          }
                          aria-label="Remove set"
                          title="Remove set"
                        >
                          <FaXmark />
                        </button>
                      </div>
                    </div>
                  ))}

                  {!ex.sets.length && (
                    <p className="text-xs text-zinc-500">
                      No sets yet.
                    </p>
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
