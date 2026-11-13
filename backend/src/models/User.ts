import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

export type UserRole = 'Admin' | 'HR' | 'Manager';
export type ManagerClassification = 
  | 'Advocate Manager' 
  | 'IT Development Manager' 
  | 'Field Executive Manager';

export type AccountStatus = 'Active' | 'Inactive';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  managerClassification?: ManagerClassification | null;
  accountStatus: AccountStatus;
  phone?: string;
  seedIdentifier?: string | null;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeJSON(): Record<string, any>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['Admin', 'HR', 'Manager'],
      required: [true, 'Role is required'],
      default: 'HR',
      index: true,
    },
    managerClassification: {
      type: String,
      enum: ['Advocate Manager', 'IT Development Manager', 'Field Executive Manager', null],
      default: null,
      validate: {
        validator: function (this: IUser, val: any) {
          if (this.role === 'Manager') {
            return (
              val === 'Advocate Manager' ||
              val === 'IT Development Manager' ||
              val === 'Field Executive Manager'
            );
          }
          return true;
        },
        message: 'Manager classification is mandatory for Manager role.',
      },
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    seedIdentifier: {
      type: String,
      default: null,
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Safe JSON serialization (strip passwordHash)
UserSchema.methods.toSafeJSON = function (): Record<string, any> {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

