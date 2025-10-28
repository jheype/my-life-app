import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import mongoose, { Schema, models } from "mongoose";

const Todo = models.Todo || mongoose.model("Todo", new Schema({
  userId: Schema.Types.ObjectId,
  title: String,
  done: Boolean,
  createdAt: Date,
  updatedAt: Date,
}, { timestamps: true }));

const Meal = models.Meal || mongoose.model("Meal", new Schema({
  userId: Schema.Types.ObjectId,
  date: Date,
  items: [{ calories: Number, protein: Number, carbs: Number, fat: Number }],
}, { timestamps: true }));

const Workout = models.Workout || mongoose.model("Workout", new Schema({
  userId: Schema.Types.ObjectId,
  date: Date,
  title: String,
}, { timestamps: true }));

const Finance = models.Finance || mongoose.model("Finance", new Schema({
  userId: Schema.Types.ObjectId,
  amount: Number, 
  type: { type: String, enum: ["income", "expense"], default: "expense" },
  categoryName: String,
  date: Date,
}, { timestamps: true }));

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = new mongoose.Types.ObjectId((session as any).userId);

  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month");
  const now = new Date();
  const [y, m] = (monthParam ?? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`)
    .split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(y, m, 1, 0, 0, 0, 0);

  const days: { date: string; start: Date; end: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - i);
    const start = new Date(d);
    const end = new Date(d); end.setDate(end.getDate() + 1);
    days.push({ date: d.toISOString().slice(0,10), start, end });
  }

  await dbConnect();

  const dayResults = await Promise.all(days.map(async (d) => {
    const [todosDone, wCount, mealsCount] = await Promise.all([
      Todo.countDocuments({ userId, done: true, updatedAt: { $gte: d.start, $lt: d.end } }),
      Workout.countDocuments({ userId, date: { $gte: d.start, $lt: d.end } }),
      Meal.countDocuments({ userId, date: { $gte: d.start, $lt: d.end } }),
    ]);
    return { date: d.date, active: (todosDone + wCount + mealsCount) > 0 };
  }));

  let streak = 0;
  for (let i = dayResults.length - 1; i >= 0; i--) {
    if (dayResults[i].active) streak++;
    else break;
  }

  const [todosCompleted, todosCreated] = await Promise.all([
    Todo.countDocuments({ userId, done: true, updatedAt: { $gte: monthStart, $lt: monthEnd } }),
    Todo.countDocuments({ userId, createdAt: { $gte: monthStart, $lt: monthEnd } }),
  ]);

  const workoutsCount = await Workout.countDocuments({ userId, date: { $gte: monthStart, $lt: monthEnd } });

  const dietAgg = await Meal.aggregate([
    { $match: { userId, date: { $gte: monthStart, $lt: monthEnd } } },
    { $unwind: "$items" },
    { $group: {
      _id: null,
      calories: { $sum: { $ifNull: ["$items.calories", 0] } },
      protein:  { $sum: { $ifNull: ["$items.protein", 0] } },
      carbs:    { $sum: { $ifNull: ["$items.carbs", 0] } },
      fat:      { $sum: { $ifNull: ["$items.fat", 0] } },
    } },
  ]);
  const diet = dietAgg[0] ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const finAgg = await Finance.aggregate([
    { $match: { userId, date: { $gte: monthStart, $lt: monthEnd } } },
    { $project: {
      categoryName: 1,
      amountSigned: {
        $cond: [{ $eq: ["$type", "income"] }, { $multiply: ["$amount", -1] }, "$amount"]
      } 
    }},
    { $group: {
      _id: "$categoryName",
      expense: { $sum: {
        $cond: [{ $lt: ["$amountSigned", 0] }, { $abs: "$amountSigned" }, 0]
      } }
    }},
    { $sort: { expense: -1 } },
    { $limit: 5 },
  ]);
  const totalExpense = finAgg.reduce((a, b) => a + (b.expense || 0), 0);
  const topCategories = finAgg.map(c => ({
    name: c._id || "Uncategorized",
    amount: c.expense || 0,
    pct: totalExpense ? (c.expense / totalExpense) * 100 : 0,
  }));

  return NextResponse.json({
    month: `${y}-${String(m).padStart(2, "0")}`,
    last7: dayResults, 
    streak,
    todos: { completed: todosCompleted, created: todosCreated },
    workouts: { count: workoutsCount },
    diet,
    finance: { spent: totalExpense, topCategories },
  });
}
