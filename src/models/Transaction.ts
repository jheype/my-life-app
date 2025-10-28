import { Schema, model, models, Types } from "mongoose";

const TransactionSchema = new Schema(
  {
    userId:     { type: Types.ObjectId, ref: "User", required: true },
    categoryId: { type: Types.ObjectId, ref: "Category", required: true },
    type:       { type: String, enum: ["income", "expense"], required: true },
    amount:     { type: Number, required: true }, 
    date:       { type: Date, required: true },
    note:       { type: String },
  },
  { timestamps: true }
);

export const Transaction = models.Transaction || model("Transaction", TransactionSchema);
