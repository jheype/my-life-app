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

function getUserIdFromSession(session: any) {
  return (
    session?.userId ||
    session?.user?.id ||
    session?.user?.userId ||
    session?.user?.uid ||
    null
  );
}

function sanitizeItems(rawItems: any): MealDocLean["items"] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems.map((it: any) => ({
    name: typeof it.name === "string" ? it.name : "Item",
    qty:
      typeof it.qty === "number" && it.qty >= 0
        ? it.qty
        : undefined,
    unit: typeof it.unit === "string" ? it.unit : "g",
    calories:
      typeof it.calories === "number" && it.calories >= 0
        ? it.calories
        : 0,
    protein:
      typeof it.protein === "number" && it.protein >= 0
        ? it.protein
        : 0,
    carbs:
      typeof it.carbs === "number" && it.carbs >= 0
        ? it.carbs
        : 0,
    fat:
      typeof it.fat === "number" && it.fat >= 0
        ? it.fat
        : 0,
  }));
}

function normalizeMealOutput(updated: MealDocLean) {
  return {
    _id: String(updated._id),
    date: new Date(updated.date).toISOString().slice(0, 10),
    type: updated.type,
    notes: updated.notes ?? "",
    items: Array.isArray(updated.items) ? updated.items : [],
  };
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const rawUserId = getUserIdFromSession(session);

    if (!rawUserId) {
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
        return NextResponse.json(
          { error: "Bad meal type" },
          { status: 400 }
        );
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
      payload.notes =
        body.notes && String(body.notes).trim() !== ""
          ? String(body.notes)
          : undefined;
    }

    if (body.items !== undefined) {
      const cleanedItems = sanitizeItems(body.items);
      payload.items = cleanedItems;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    await dbConnect();

    const userObjectId = new Types.ObjectId(rawUserId);

    const updatedRaw = await Meal.findOneAndUpdate(
      { _id: id, userId: userObjectId },
      { $set: payload },
      { new: true, lean: true }
    );

    const updated = updatedRaw as unknown as MealDocLean | null;

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(normalizeMealOutput(updated), { status: 200 });
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
    const rawUserId = getUserIdFromSession(session);

    if (!rawUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: routeId } = await ctx.params;
    const id = cleanId(routeId);

    if (!id || !validObjectId(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    await dbConnect();

    const userObjectId = new Types.ObjectId(rawUserId);

    const res = await Meal.deleteOne({ _id: id, userId: userObjectId });

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
