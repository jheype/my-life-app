import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Todo } from "@/models/Todo";
import { Types } from "mongoose";

function isId(id: string) {
  return Types.ObjectId.isValid(id);
}

export async function PATCH(
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
  const todo = await Todo.findOne({ _id: id, userId: (session as any).userId });
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  todo.done = !todo.done;
  await todo.save();
  return NextResponse.json(todo);
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
  const res = await Todo.deleteOne({ _id: id, userId: (session as any).userId });
  if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
