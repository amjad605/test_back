import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Owner", "Staff", "Client", "HR"],
      default: "Staff",
    },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = model("User", UserSchema);
