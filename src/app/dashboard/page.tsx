import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import TodoList from "@/components/todos/TodoList";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? "friend";

  return (
    <section className="mt-8 grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Welcome back, {name}</h1>
        <p className="mt-1 text-zinc-600">
          Plan your day and access your personal tools.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">To-Dos</h2>
              <span className="text-sm text-zinc-500">Your personal task list</span>
            </div>
            <TodoList />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Finances</h3>
            <p className="mt-1 text-zinc-600">
              Track monthly expenses and incomes, manage categories, and see a pie chart by category.
            </p>
            <Link href="/dashboard/finances" className="btn btn-primary mt-4 inline-flex cursor-pointer">
              Open Finances
            </Link>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold">Workouts</h3>
            <p className="mt-1 text-zinc-600">
              Plan your training sessions and log sets & reps. (Coming soon)
            </p>
            <Link href="/dashboard/workouts" className="btn btn-ghost mt-4 inline-flex cursor-pointer">
              Go to Workouts
            </Link>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold">Diet</h3>
            <p className="mt-1 text-zinc-600">
              Build your meal plan and track macros. (Coming soon)
            </p>
            <Link href="/dashboard/diet" className="btn btn-ghost mt-4 inline-flex cursor-pointer">
              Go to Diet
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
