import WorkoutPanel from "./WorkoutPanel";

export default function WorkoutsPage() {
  return (
    <section className="mt-8 grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Workouts</h1>
        <p className="mt-1 text-zinc-600">
          Plan sessions, add exercises and sets, and track progress.
        </p>
      </div>
      <WorkoutPanel />
    </section>
  );
}
