import { Schema, model, models, Types } from "mongoose";

const MealItemSchema = new Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, default: 1 }, 
    unit: { type: String, default: "g" },
    calories: { type: Number, required: true }, 
    protein: { type: Number, default: 0 },      
    carbs: { type: Number, default: 0 },        
    fat: { type: Number, default: 0 },          
  },
  { _id: false }
);

const MealSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ["Breakfast", "Lunch", "Dinner", "Snack"], required: true },
    notes: { type: String },
    items: { type: [MealItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Meal = models.Meal || model("Meal", MealSchema);
