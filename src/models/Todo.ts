import { Schema, model, models, Types } from "mongoose";

const TodoSchema = new Schema(
  {
    userId:   { type: Types.ObjectId, ref: "User", required: true },
    title:    { type: String, required: true },
    done:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Todo = models.Todo || model("Todo", TodoSchema);
