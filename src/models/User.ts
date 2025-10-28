import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name:        { type: String, required: true },
    email:       { type: String, unique: true, required: true },
    passwordHash:{ type: String, required: true },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
