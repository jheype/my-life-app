import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Category } from "@/models/Category";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const rows = await Category.find({ userId: (session as any).userId }).sort({ createdAt: -1 });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, color, icon } = await req.json();
  if (!name || !color || !icon) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await dbConnect();
  const doc = await Category.create({
    userId: (session as any).userId,
    name: String(name).trim(),
    color: String(color),
    icon: String(icon),
  });

  return NextResponse.json(doc, { status: 201 });
}
