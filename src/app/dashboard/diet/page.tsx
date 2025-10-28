import DietPanel from "@/components/diet/DietPanel";

export default function DietPage() {
  return (
    <section className="mt-8 grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Diet</h1>
        <p className="mt-1 text-zinc-600">
          Plan meals, add food items, and track monthly macros.
        </p>
      </div>
      <DietPanel />
    </section>
  );
}
