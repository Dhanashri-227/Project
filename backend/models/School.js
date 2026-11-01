import mongoose from 'mongoose';

const classSummarySchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    teacherId: {
      type: String,
      default: '',
    },
    teacherName: {
      type: String,
      default: 'Class Teacher',
      trim: true,
    },
    teacherEmail: {
      type: String,
      default: '',
      trim: true,
    },
    studentCount: {
      type: Number,
      default: 0,
    },
    passCount: {
      type: Number,
      default: 0,
    },
    failCount: {
      type: Number,
      default: 0,
    },
    avgPercentage: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const schoolSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    totalClasses: {
      type: Number,
      default: 0,
    },
    passPercentage: {
      type: Number,
      default: 0,
    },
    classes: [classSummarySchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    lastAction: {
      type: String,
      default: 'Initialized',
      trim: true,
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

// Compound/single indexes for fast lookup
schoolSchema.index({ schoolName: 1 });

export const SchoolModel = mongoose.model('School', schoolSchema);
