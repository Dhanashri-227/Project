import mongoose from 'mongoose';
import { TeacherModel } from './models/Teacher.js';
import { StudentModel } from './models/Student.js';

export async function connectDB(mongoUri) {
  const URI = mongoUri || process.env.MONGO_URI || 'mongodb://localhost:27017/marks';
  try {
    console.log(`Connecting to MongoDB at: ${URI}...`);
    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✅ MongoDB connected successfully to database: marks (Collection: students & teachers)');
    return true;
  } catch (err) {
    console.warn('⚠️  MongoDB Connection Warning:', err.message);
    console.warn('ℹ️  Ensure MongoDB service is running (or start MongoDB Compass). Running in resilient storage mode.');
    return false;
  }
}

export async function clearAllStudentData() {
  if (mongoose.connection.readyState === 1) {
    await StudentModel.deleteMany({});
  }
  return [];
}

