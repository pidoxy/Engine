import mongoose, { Document, Schema, Types } from "mongoose";
import { IUser } from "./user.model";
// Interface for Organization document
export interface IOrganization extends Document {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId | IUser;
}

// Create the Organization schema
const organizationSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Create the models
export const Organization = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema
);
