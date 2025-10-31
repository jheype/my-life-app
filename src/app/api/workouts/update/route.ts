import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Workout } from "@/models/Workout";

function cleanId(raw: unknown) {
  if (!raw) return "";
  return String(raw).trim().replace(/^"|"$/g, "");
}

interface WorkoutForClient {
  _id: string;
  userId: string;
  date: string;
  title: string;
  notes?: string;
  exercises?: {
    name: string;
    notes?: string;
    sets: { reps: number; weight?: number; done?: boolean }[];
  }[];
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.userId;
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

    const updatePayload: Record<string, unknown> = {};
    if (body.exercises !== undefined) {
      updatePayload.exercises = body.exercises;
    }
    await dbConnect();
    const updatedRaw = await Workout.findOneAndUpdate(
      { _id: workoutId, userId },
      { $set: updatePayload },
      { new: true, lean: true }
    );

    if (!updatedRaw) {
      return NextResponse.json(
        { error: "Workout not found or not owned by user" },
        { status: 404 }
      );
    }

    const updated: WorkoutForClient = {
      _id: String((updatedRaw as any)._id),
      userId: String((updatedRaw as any).userId),
      date: (updatedRaw as any).date ?? "",
      title: (updatedRaw as any).title ?? "",
      notes: (updatedRaw as any).notes ?? "",
      exercises: Array.isArray((updatedRaw as any).exercises)
        ? (updatedRaw as any).exercises
        : [],
    };

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/workouts/update] error", err);
    return NextResponse.json(
      { error: "Failed to update workout" },
      { status: 500 }
    );
  }
}
