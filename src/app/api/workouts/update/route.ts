import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Workout } from "@/models/Workout";

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

function cleanId(raw: unknown) {
  if (!raw) return "";
  return String(raw).trim().replace(/^"|"$/g, "");
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

function sanitizeExercises(raw: any): any[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((ex: any) => ({
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
  }));
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserIdFromSession(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const workoutId = cleanId(body.id);

    if (!workoutId) {
      return NextResponse.json(
        { error: "Missing workout id" },
        { status: 400 }
      );
    }

    const updatePayload: any = {};

    if (body.exercises !== undefined) {
      const cleaned = sanitizeExercises(body.exercises);
      updatePayload.exercises = cleaned;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    await dbConnect();

    const updated = await Workout.findOneAndUpdate(
      { _id: workoutId, userId },
      { $set: updatePayload },
      { new: true, lean: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Workout not found or not owned by user" },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeWorkout(updated), {
      status: 200,
    });
  } catch (err) {
    console.error("[PATCH /api/workouts/update] error", err);
    return NextResponse.json(
      { error: "Failed to update workout" },
      { status: 500 }
    );
  }
}
