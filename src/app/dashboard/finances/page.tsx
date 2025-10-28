import FinancePanel from "@/components/finance/FinancePanel";

export default function FinancesPage() {
  return (
    <section className="mt-8 grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Finances</h1>
        <p className="mt-1 text-zinc-600">
          Manage categories, record transactions, and track monthly spending.
        </p>
      </div>
      <FinancePanel />
    </section>
  );
}
