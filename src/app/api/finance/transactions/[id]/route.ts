import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
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
  if (body.amount != null) {
    const n = Number(body.amount);
    if (isNaN(n) || n <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    payload.amount = n;
  }
  if (body.type) {
    if (body.type !== "income" && body.type !== "expense")
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    payload.type = body.type;
  }
  if (body.categoryId) {
    if (!Types.ObjectId.isValid(body.categoryId))
      return NextResponse.json({ error: "Bad categoryId" }, { status: 400 });
    payload.categoryId = body.categoryId;
  }
  if (body.date) {
    const when = new Date(body.date);
    if (isNaN(when.getTime())) return NextResponse.json({ error: "Bad date" }, { status: 400 });
    payload.date = when;
  }
  if (body.note !== undefined) payload.note = String(body.note);

  await dbConnect();
  const updated = await Transaction.findOneAndUpdate(
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
  const res = await Transaction.deleteOne({ _id: id, userId: (session as any).userId });
  if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
