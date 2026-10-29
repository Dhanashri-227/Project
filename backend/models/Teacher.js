import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    schoolName: {
      type: String,
      default: 'Academic Institution',
      trim: true,
    },
    assignedClass: {
      type: String,
      required: true,
      default: 'Class 10',
    },
    assignedSection: {
      type: String,
      required: true,
      default: 'A',
    },
    subjectSpecialization: {
      type: String,
      default: 'Class Teacher',
      trim: true,
    },
    role: {
      type: String,
      default: 'Class Teacher',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Enforce unique 1-to-1 Class Teacher assignment per classroom (Class + Section)
teacherSchema.index({ assignedClass: 1, assignedSection: 1 }, { unique: true });

export const TeacherModel = mongoose.model('Teacher', teacherSchema);
