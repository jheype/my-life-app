import { Schema, model, models, Types } from "mongoose";

const WorkoutSetSchema = new Schema(
  {
    reps: { type: Number, required: true },
    weight: { type: Number, default: undefined },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const WorkoutExerciseSchema = new Schema(
  {
    name: { type: String, required: true },
    notes: { type: String, default: "" },
    sets: { type: [WorkoutSetSchema], default: [] },
  },
  { _id: false }
);

const WorkoutSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },

    // guarda como Date no banco (igual Meal)
    date: { type: Date, required: true },

    title: { type: String, required: true },
    notes: { type: String, default: "" },

    exercises: { type: [WorkoutExerciseSchema], default: [] },
  },
  { timestamps: true }
);

export const Workout = models.Workout || model("Workout", WorkoutSchema);
