import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: String,
      required: true,
      index: true,
    },
    teacherEmail: {
      type: String,
      index: true,
    },
    schoolName: {
      type: String,
      default: 'Academic Institution',
      trim: true,
      index: true,
    },
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      default: 'Class 10',
    },
    section: {
      type: String,
      required: true,
      default: 'A',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    subjects: {
      maths: { type: Number, required: true, default: 0 },
      science: { type: Number, required: true, default: 0 },
      english: { type: Number, required: true, default: 0 },
      hindi: { type: Number, required: true, default: 0 },
      socialScience: { type: Number, required: true, default: 0 },
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    maxTotalMarks: {
      type: Number,
      default: 500,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    grade: {
      type: String,
      required: true,
      default: 'F',
    },
    status: {
      type: String,
      enum: ['Pass', 'Fail'],
      required: true,
      default: 'Pass',
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    studentPin: {
      type: String,
      default: function () {
        return this.rollNo ? `123$${this.rollNo}` : '';
      },
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

// Compound index to ensure uniqueness of Roll No per class per teacher
studentSchema.index({ teacherId: 1, className: 1, rollNo: 1 });

export const StudentModel = mongoose.model('Student', studentSchema);
