import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Meal } from "@/models/Meal";
import { Types } from "mongoose";

interface MealDocLean {
  _id: string;
  userId: string;
  date: Date;
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  notes?: string;
  items: {
    name: string;
    qty?: number;
    unit?: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }[];
}

function validObjectId(v: unknown) {
  return typeof v === "string" && Types.ObjectId.isValid(v);
}

function cleanId(raw: unknown) {
  if (!raw) return "";
  return String(raw).trim().replace(/^"|"$/g, "");
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: routeId } = await ctx.params;
    const id = cleanId(routeId);
    if (!id || !validObjectId(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    const payload: any = {};

    if (body.type !== undefined) {
      if (!["Breakfast", "Lunch", "Dinner", "Snack"].includes(body.type)) {
        return NextResponse.json({ error: "Bad meal type" }, { status: 400 });
      }
      payload.type = body.type;
    }

    if (body.date !== undefined) {
      const d = new Date(body.date);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Bad date" }, { status: 400 });
      }
      payload.date = d;
    }

    if (body.notes !== undefined) {
      payload.notes = body.notes ? String(body.notes) : undefined;
    }

    if (Array.isArray(body.items)) {
      payload.items = body.items;
    }
    await dbConnect();
    const updatedRaw = await Meal.findOneAndUpdate(
      { _id: id, userId },
      { $set: payload },
      { new: true, lean: true }
    );

    const updated = updatedRaw as unknown as MealDocLean | null;

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const normalized = {
      _id: String(updated._id),
      date: new Date(updated.date).toISOString().slice(0, 10),
      type: updated.type,
      notes: updated.notes ?? "",
      items: Array.isArray(updated.items) ? updated.items : [],
    };

    return NextResponse.json(normalized, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/diet/meals/[id] error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: routeId } = await ctx.params;
    const id = cleanId(routeId);
    if (!id || !validObjectId(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }
    await dbConnect();
    const res = await Meal.deleteOne({ _id: id, userId });

    if (!res.deletedCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/diet/meals/[id] error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
