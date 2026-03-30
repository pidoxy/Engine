import mongoose, { Document, Schema } from "mongoose";

export interface IRole extends Document {
  name: string;
  organizationId: mongoose.Types.ObjectId;
  permissions: string[];
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true, // Index for faster queries by organization
    },
    permissions: [
      {
        type: String,
        required: true,
      },
    ],
    description: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Composite unique index on name + organizationId
RoleSchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const Role = mongoose.model<IRole>("Role", RoleSchema);
