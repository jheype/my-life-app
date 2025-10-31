import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Workout } from "@/models/Workout";

function getMonthRange(month: string | null) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split("-").map((n) => parseInt(n, 10));
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);
  return { start, end };
}

function serializeWorkout(doc: any) {
  return {
    _id: String(doc._id),
    userId: String(doc.userId),
    date:
      doc.date instanceof Date
        ? doc.date.toISOString().slice(0, 10)
        : String(doc.date),
    title: doc.title ?? "",
    notes: doc.notes ?? "",
    exercises: Array.isArray(doc.exercises) ? doc.exercises : [],
  };
}

function getUserIdFromSession(session: any) {
  return (
    session?.userId ||
    session?.user?.id ||
    session?.user?.userId ||
    session?.user?.uid ||
    null
  );
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = getUserIdFromSession(session);

  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const range = getMonthRange(monthParam);

  await dbConnect();

  const query: any = { userId };
  if (range) {
    query.date = { $gte: range.start, $lt: range.end };
  }

  const docs = await Workout.find(query)
    .sort({ date: -1, _id: -1 })
    .lean();

  const safe = docs.map(serializeWorkout);

  return NextResponse.json(safe, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserIdFromSession(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const rawBody = await req.json();

    const cleanExercises = Array.isArray(rawBody.exercises)
      ? rawBody.exercises.map((ex: any) => ({
          name: typeof ex.name === "string" ? ex.name : "Exercise",
          notes: typeof ex.notes === "string" ? ex.notes : "",
          sets: Array.isArray(ex.sets)
            ? ex.sets.map((s: any) => ({
                reps:
                  typeof s.reps === "number" && s.reps > 0
                    ? s.reps
                    : 1,
                weight:
                  typeof s.weight === "number" ? s.weight : undefined,
                done: !!s.done,
              }))
            : [],
        }))
      : [];

    const finalDoc = {
      userId,
      date: rawBody.date
        ? new Date(rawBody.date)
        : new Date(), 
      title:
        typeof rawBody.title === "string"
          ? rawBody.title
          : "Workout",
      notes:
        typeof rawBody.notes === "string" &&
        rawBody.notes.trim() !== ""
          ? rawBody.notes
          : "",
      exercises: cleanExercises,
    };

    const created = await Workout.create(finalDoc);

    return NextResponse.json(serializeWorkout(created), {
      status: 201,
    });
  } catch (err) {
    console.error("POST /api/workouts error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
