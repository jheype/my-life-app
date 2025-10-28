import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || String(name).trim().length < 2) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
    if (!emailOk) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!password || String(password).length < 6) {
      return NextResponse.json({ error: "Weak password" }, { status: 400 });
    }

    await dbConnect();

    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const doc = await User.create({ name: name.trim(), email: String(email).toLowerCase(), passwordHash });

    return NextResponse.json({ ok: true, id: String(doc._id) }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
