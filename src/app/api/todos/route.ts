import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Todo } from "@/models/Todo";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const todos = await Todo.find({ userId: (session as any).userId })
    .sort({ createdAt: -1 });
  return NextResponse.json(todos);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { title } = await req.json();
  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  await dbConnect();
  const todo = await Todo.create({
    userId: (session as any).userId,
    title: String(title).trim(),
  });
  return NextResponse.json(todo, { status: 201 });
}
