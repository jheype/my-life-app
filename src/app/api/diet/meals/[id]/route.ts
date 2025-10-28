import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Meal } from "@/models/Meal";
import { Types } from "mongoose";

function isId(id: string) {
  return Types.ObjectId.isValid(id);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!isId(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const body = await req.json();
  const payload: any = {};
  if (body.type) {
    if (!["Breakfast", "Lunch", "Dinner", "Snack"].includes(body.type)) {
      return NextResponse.json({ error: "Bad meal type" }, { status: 400 });
    }
    payload.type = body.type;
  }
  if (body.date) {
    const d = new Date(body.date);
    if (isNaN(d.getTime())) return NextResponse.json({ error: "Bad date" }, { status: 400 });
    payload.date = d;
  }
  if (body.notes !== undefined) payload.notes = String(body.notes);
  if (Array.isArray(body.items)) payload.items = body.items;

  await dbConnect();
  const updated = await Meal.findOneAndUpdate(
    { _id: id, userId: (session as any).userId },
    { $set: payload },
    { new: true }
  );
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!isId(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  await dbConnect();
  const res = await Meal.deleteOne({ _id: id, userId: (session as any).userId });
  if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
