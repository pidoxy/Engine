import mongoose, { Document, Schema } from "mongoose";

export interface IConsultation extends Document {
  consultant: mongoose.Types.ObjectId;
  patient: string; // Changed to string since Patient _id is now UUID
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const consultationSchema = new Schema<IConsultation>(
  {
    consultant: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    patient: {
      type: String,
      ref: "Patient",
    },
    title: {
      type: String,
      default: "New Consultation",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate to get all messages in this consultation
consultationSchema.virtual("messages", {
  ref: "Chat",
  foreignField: "consultationId",
  localField: "_id",
});

// Virtual populate to get patient details
consultationSchema.virtual("patientDetails", {
  ref: "Patient",
  foreignField: "_id",
  localField: "patient",
  justOne: true,
});

// Indexes for faster queries
consultationSchema.index({ consultant: 1, createdAt: -1 });
consultationSchema.index({ patient: 1, createdAt: -1 });
consultationSchema.index({ isActive: 1 });

const Consultation = mongoose.model<IConsultation>(
  "Consultation",
  consultationSchema
);

export default Consultation;
