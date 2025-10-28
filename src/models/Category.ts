import { Schema, model, models, Types } from "mongoose";

const CategorySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    name:   { type: String, required: true },
    color:  { type: String, required: true }, 
    icon:   { type: String, required: true }, 
  },
  { timestamps: true }
);

export const Category = models.Category || model("Category", CategorySchema);
