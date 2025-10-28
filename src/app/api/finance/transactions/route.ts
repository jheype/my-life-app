import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Types } from "mongoose";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const month = url.searchParams.get("month"); 
  let filter: any = { userId: (session as any).userId };

  if (month) {
    const [y, m] = month.split("-").map((n) => parseInt(n));
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 1, 0, 0, 0, 0);
    filter.date = { $gte: start, $lt: end };
  }

  await dbConnect();
  const rows = await Transaction.find(filter).sort({ date: -1 }).lean();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { amount, type, categoryId, date, note } = await req.json();

  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (type !== "income" && type !== "expense") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!Types.ObjectId.isValid(categoryId)) {
    return NextResponse.json({ error: "Bad categoryId" }, { status: 400 });
  }
  const when = date ? new Date(date) : new Date();
  if (isNaN(when.getTime())) {
    return NextResponse.json({ error: "Bad date" }, { status: 400 });
  }

  await dbConnect();
  const doc = await Transaction.create({
    userId: (session as any).userId,
    categoryId,
    type,
    amount,
    date: when,
    note: note ? String(note) : undefined,
  });
  return NextResponse.json(doc, { status: 201 });
}
