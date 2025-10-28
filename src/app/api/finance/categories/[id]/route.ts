import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { Types } from "mongoose";

function isId(id: string) {
  return Types.ObjectId.isValid(id);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!isId(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const body = await req.json();
  const payload: any = {};
  if (body.name)  payload.name  = String(body.name).trim();
  if (body.color) payload.color = String(body.color);
  if (body.icon)  payload.icon  = String(body.icon);

  await dbConnect();
  const updated = await Category.findOneAndUpdate(
    { _id: id, userId: (session as any).userId },
    { $set: payload },
    { new: true }
  );
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!isId(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  await dbConnect();
  const res = await Category.deleteOne({ _id: id, userId: (session as any).userId });
  if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
