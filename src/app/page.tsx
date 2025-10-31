import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MonthlyInsights from "@/components/home/MonthlyInsights";
import DashboardOverview from "@/components/DashboardOverview";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAuthed = !!session;
  const name = session?.user?.name ?? "friend";

  if (isAuthed) {
    return (
      <main className="mx-auto w-full max-w-app px-4">
        <section className="mt-16 rounded-2xl border border-[var(--color-base-border)] bg-[var(--color-base-card)] p-8">
          <h1 className="text-3xl font-semibold">Welcome back, {name}</h1>
          <p className="mt-2 text-zinc-600">Jump into your day: tasks, workouts, diet, and finances — all in one place.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn btn-primary">Open Dashboard</Link>
            <Link href="/dashboard/finances" className="btn btn-ghost">Finances</Link>
            <Link href="/dashboard/workouts" className="btn btn-ghost">Workouts</Link>
            <Link href="/dashboard/diet" className="btn btn-ghost">Diet</Link>
          </div>
        </section>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <DashboardOverview/>
          <MonthlyInsights />
        </section>


        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Today’s focus</h3>
            <p className="mt-1 text-zinc-600">
              Review your to-dos and plan the next steps.
            </p>
            <Link href="/dashboard" className="btn btn-ghost mt-4 inline-flex">
              Go to To-Dos
            </Link>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold">This month’s spend</h3>
            <p className="mt-1 text-zinc-600">
              Track expenses and see category insights.
            </p>
            <Link href="/dashboard/finances" className="btn btn-ghost mt-4 inline-flex">
              Open Finances
            </Link>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold">Train & eat</h3>
            <p className="mt-1 text-zinc-600">
              Log workouts and meals to stay consistent.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/dashboard/workouts" className="btn btn-ghost">
                Workouts
              </Link>
              <Link href="/dashboard/diet" className="btn btn-ghost">
                Diet
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-app px-4">
      <section className="mt-16 rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-3xl font-semibold">Your personal routine hub</h1>
        <p className="mx-auto mt-2 max-w-2xl text-zinc-600">
          Plan tasks, workouts, diet, and finances all in one place.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/register" className="btn btn-primary">
            Sign up
          </Link>
          <Link href="/login" className="btn btn-ghost">
            Log in
          </Link>
        </div>
      </section>
    </main>
  );
}
