import { Schema, model, models, Types } from "mongoose";

const SetSchema = new Schema(
  {
    reps: { type: Number, required: true },
    weight: { type: Number, required: false }, 
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const ExerciseSchema = new Schema(
  {
    name: { type: String, required: true },
    sets: { type: [SetSchema], default: [] },
    notes: { type: String },
  },
  { _id: false }
);

const WorkoutSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true }, 
    notes: { type: String },
    exercises: { type: [ExerciseSchema], default: [] },
  },
  { timestamps: true }
);

export const Workout = models.Workout || model("Workout", WorkoutSchema);
