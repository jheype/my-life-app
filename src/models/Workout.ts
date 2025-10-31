import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IWorkout extends Document {
  userId: string;
  date: Date;
  title: string;
  notes?: string;
  exercises?: {
    name: string;
    notes?: string;
    sets: { reps: number; weight?: number; done?: boolean }[];
  }[];
}

const SetSchema = new Schema(
  {
    reps: { type: Number, required: true },
    weight: { type: Number },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const ExerciseSchema = new Schema(
  {
    name: { type: String, required: true },
    notes: { type: String },
    sets: { type: [SetSchema], default: [] },
  },
  { _id: false }
);

const workoutSchema = new Schema(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true },
    notes: { type: String },
    exercises: { type: [ExerciseSchema], default: [] },
  },
  { timestamps: true }
);

export const Workout =
  models.Workout || model<IWorkout>("Workout", workoutSchema);
