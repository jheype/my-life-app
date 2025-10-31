import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Workout } from "@/models/Workout";

// helper: transforma Date -> "YYYY-MM-DD"
function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

// helper: pega início e fim do mês para filtrar no banco
function getMonthRange(monthParam: string | null) {
  // monthParam no formato "2025-10"
  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) return null;
  const [yStr, mStr] = monthParam.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));

  return { start, end };
}

// ================== GET /api/workouts?month=YYYY-MM ==================
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;

  if (!userId) {
    // não logado -> lista vazia
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

  // pega todos do mês
  const docs = await Workout.find(query)
    .sort({ date: -1, _id: -1 })
    .lean();

  // normaliza pro front (importantíssimo!)
  const safe = docs.map((w: any) => ({
    _id: String(w._id),
    userId: String(w.userId),
    date: w.date instanceof Date ? toYMD(w.date) : String(w.date),
    title: w.title ?? "",
    notes: w.notes ?? "",
    exercises: Array.isArray(w.exercises) ? w.exercises : [],
  }));

  return NextResponse.json(safe, { status: 200 });
}

// ================== POST /api/workouts ==================
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();

    console.log("[POST /api/workouts] raw body:", body);

    // força date -> Date real (UTC meia-noite)
    let workoutDate: Date;
    if (
      typeof body.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(body.date)
    ) {
      workoutDate = new Date(body.date + "T00:00:00.000Z");
    } else {
      workoutDate = new Date();
    }

    // normaliza exercises/sets
    const cleanExercises = Array.isArray(body.exercises)
      ? body.exercises.map((ex: any) => ({
          name: typeof ex?.name === "string" ? ex.name : "",
          notes: typeof ex?.notes === "string" ? ex.notes : "",
          sets: Array.isArray(ex?.sets)
            ? ex.sets.map((s: any) => ({
                reps: Number(s?.reps) || 0,
                weight:
                  s?.weight === undefined ||
                  s?.weight === null ||
                  s?.weight === ""
                    ? undefined
                    : Number(s.weight),
                done: !!s?.done,
              }))
            : [],
        }))
      : [];

    console.log(
      "[POST /api/workouts] cleanExercises we're about to save:",
      cleanExercises
    );

    const created = await Workout.create({
      userId,
      date: workoutDate,
      title: typeof body.title === "string" ? body.title : "",
      notes: typeof body.notes === "string" ? body.notes : "",
      exercises: cleanExercises,
    });

    console.log(
      "[POST /api/workouts] created doc from mongo:",
      created
    );

    // resposta no formato que o front espera
    return NextResponse.json(
      {
        _id: String(created._id),
        userId: String(created.userId),
        date: toYMD(workoutDate),
        title: created.title ?? "",
        notes: created.notes ?? "",
        exercises: cleanExercises,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/workouts error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
