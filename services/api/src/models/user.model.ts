import crypto from "crypto";
import bcrypt from "bcrypt";
import mongoose, {
  Schema,
  type Document,
  type Query,
  type Model,
} from "mongoose";
import AppError from "@/utils/appError";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  password: string;
  organization: mongoose.Types.ObjectId;
  role: UserRole;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export enum UserRole {
  CONSULTANT = "consultant",
  ORGANIZATION = "organization",
  COMMUNITY_HEALTH_WORKER = "chw",
}

export interface UserDocument extends IUser, Document {
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
}

interface UserModel extends Model<UserDocument> {
  build(attrs: IUser): UserDocument;
}

const userSchema = new Schema<UserDocument>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true, // Index for faster queries by organization
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CONSULTANT,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.passwordChangedAt;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.pre("save", function (next) {
  if (
    this.organization &&
    this.role !== UserRole.CONSULTANT &&
    this.role !== UserRole.ORGANIZATION &&
    this.role !== UserRole.COMMUNITY_HEALTH_WORKER
  ) {
    return next(
      new AppError(
        "Users with an organization ID must have role set to 'consultant', 'organization' or 'community health worker'",
        400
      )
    );
  }

  next();
});

userSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as any;

  if (!update) return next();

  // If setting organization, ensure role is appropriate
  if (
    update.organization &&
    update.role &&
    update.role !== UserRole.CONSULTANT &&
    update.role !== UserRole.COMMUNITY_HEALTH_WORKER
  ) {
    return next(
      new AppError(
        "Users with an organization ID must have role set to 'consultant', 'organization' or 'community health worker'",
        400
      )
    );
  }
  next();
});

userSchema.pre(/^find/, function (this: Query<any, Document>, next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> => await bcrypt.compare(candidatePassword, userPassword);

userSchema.methods.changedPasswordAfter = function (
  JWTTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken;
};

userSchema.statics.build = (attrs: IUser) => {
  return new User(attrs);
};

const User = mongoose.model<UserDocument, UserModel>("User", userSchema);

export default User;
