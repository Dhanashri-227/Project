import mongoose from 'mongoose';
import { TeacherModel } from './models/Teacher.js';
import { StudentModel } from './models/Student.js';

const DEFAULT_ATLAS_URI = 'mongodb+srv://dhanshri1701_db_user:qLwo6FwxYyrrtTBc@cluster0.xrna8qo.mongodb.net/marks?retryWrites=true&w=majority';

export async function connectDB(mongoUri) {
  const URI = mongoUri || process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_ATLAS_URI;
  try {
    const sanitizedUri = URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to MongoDB Atlas at: ${sanitizedUri}...`);
    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ MongoDB connected successfully to database: marks (Collection: students & teachers)');
    return true;
  } catch (err) {
    console.warn('⚠️  MongoDB Connection Warning:', err.message);
    console.warn('ℹ️  Atlas Check: Ensure your current IP is whitelisted in MongoDB Atlas Network Access (or 0.0.0.0/0).');
    return false;
  }
}

export async function clearAllStudentData() {
  if (mongoose.connection.readyState === 1) {
    await StudentModel.deleteMany({});
  }
  return [];
}
