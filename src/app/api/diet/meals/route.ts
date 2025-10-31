import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Meal } from "@/models/Meal";

function getMonthRange(month: string | null) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split("-").map((n) => parseInt(n, 10));
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);
  return { start, end };
}

function serializeMeal(doc: any) {
  return {
    _id: String(doc._id),
    date: new Date(doc.date).toISOString().slice(0, 10),
    type: doc.type ?? "",
    notes: doc.notes ?? "",
    items: Array.isArray(doc.items)
      ? doc.items.map((it: any) => ({
          name: it.name ?? "",
          qty: typeof it.qty === "number" ? it.qty : undefined,
          unit: it.unit ?? "g",
          calories: typeof it.calories === "number" ? it.calories : 0,
          protein: typeof it.protein === "number" ? it.protein : 0,
          carbs: typeof it.carbs === "number" ? it.carbs : 0,
          fat: typeof it.fat === "number" ? it.fat : 0,
        }))
      : [],
  };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }

  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const range = getMonthRange(month);

  const filter: any = { userId };
  if (range) {
    filter.date = { $gte: range.start, $lt: range.end };
  }

  await dbConnect();

  const rows = await Meal.find(filter)
    .sort({ date: -1, _id: -1 })
    .lean();

  const safe = rows.map(serializeMeal);

  return NextResponse.json(safe, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { date, type, notes, items } = body;

    if (!date || !type) {
      return NextResponse.json(
        { error: "Missing date/type" },
        { status: 400 }
      );
    }

    if (!["Breakfast", "Lunch", "Dinner", "Snack"].includes(type)) {
      return NextResponse.json(
        { error: "Bad meal type" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    for (const it of items) {
      if (
        typeof it?.name !== "string" ||
        typeof it?.calories !== "number" ||
        it.calories <= 0
      ) {
        return NextResponse.json(
          { error: "Each item must have name and positive calories" },
          { status: 400 }
        );
      }
    }

    await dbConnect();

    const created = await Meal.create({
      userId,
      date: new Date(date),
      type,
      notes: notes ? String(notes) : undefined,
      items,
    });

    return NextResponse.json(serializeMeal(created), { status: 201 });
  } catch (err) {
    console.error("POST /api/diet/meals error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
