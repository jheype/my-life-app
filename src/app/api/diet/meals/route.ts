import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Meal } from "@/models/Meal";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const month = url.searchParams.get("month");

  const filter: any = { userId: (session as any).userId };
  if (month) {
    const [y, m] = month.split("-").map((n) => parseInt(n));
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 1, 0, 0, 0, 0);
    filter.date = { $gte: start, $lt: end };
  }

  await dbConnect();
  const rows = await Meal.find(filter).sort({ date: -1 }).lean();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { date, type, notes, items } = body;

  if (!date || !type) {
    return NextResponse.json({ error: "Missing date/type" }, { status: 400 });
  }
  if (!["Breakfast", "Lunch", "Dinner", "Snack"].includes(type)) {
    return NextResponse.json({ error: "Bad meal type" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }
  for (const it of items) {
    if (typeof it?.name !== "string" || typeof it?.calories !== "number" || it.calories <= 0) {
      return NextResponse.json({ error: "Each item must have name and positive calories" }, { status: 400 });
    }
  }

  await dbConnect();
  const doc = await Meal.create({
    userId: (session as any).userId,
    date: new Date(date),
    type,
    notes: notes ? String(notes) : undefined,
    items,
  });

  return NextResponse.json(doc, { status: 201 });
}
