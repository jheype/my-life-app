import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Workout } from "@/models/Workout";

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
  const rows = await Workout.find(filter).sort({ date: -1 }).lean();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { date, title, notes, exercises } = body;

  if (!date || !title) {
    return NextResponse.json({ error: "Missing date/title" }, { status: 400 });
  }

  await dbConnect();
  const doc = await Workout.create({
    userId: (session as any).userId,
    date: new Date(date),
    title: String(title).trim(),
    notes: notes ? String(notes) : undefined,
    exercises: Array.isArray(exercises) ? exercises : [],
  });

  return NextResponse.json(doc, { status: 201 });
}
