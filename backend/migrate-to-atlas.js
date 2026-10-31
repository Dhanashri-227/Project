import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const LOCAL_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/marks';
const ATLAS_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb+srv://dhanshri1701_db_user:qLwo6FwxYyrrtTBc@cluster0.xrna8qo.mongodb.net/marks?retryWrites=true&w=majority';

async function migrateData() {
  console.log('====================================================');
  console.log('🔄 Data Migration: Local MongoDB ➡️ MongoDB Atlas');
  console.log('====================================================\n');

  console.log(`📡 Connecting to Local MongoDB at: ${LOCAL_URI}...`);
  let localConn;
  try {
    localConn = await mongoose.createConnection(LOCAL_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
    console.log('✅ Connected to Local MongoDB successfully!\n');
  } catch (err) {
    console.error('❌ Could not connect to Local MongoDB:', err.message);
    console.log('\n💡 Tip: Please ensure MongoDB Compass or Local MongoDB Service is running on your computer.');
    process.exit(1);
  }

  const sanitizedAtlas = ATLAS_URI.replace(/:([^:@]+)@/, ':****@');
  console.log(`📡 Connecting to MongoDB Atlas at: ${sanitizedAtlas}...`);
  let atlasConn;
  try {
    atlasConn = await mongoose.createConnection(ATLAS_URI, { serverSelectionTimeoutMS: 20000 }).asPromise();
    console.log('✅ Connected to MongoDB Atlas successfully!\n');
  } catch (err) {
    console.error('❌ Could not connect to MongoDB Atlas:', err.message);
    console.log('\n💡 Tip: Verify your internet connection and Atlas Network Access (IP Whitelist 0.0.0.0/0).');
    await localConn.close();
    process.exit(1);
  }

  try {
    // 1. Migrate Teachers
    console.log('🔍 Checking Teachers collection...');
    const localTeachers = await localConn.collection('teachers').find({}).toArray();
    console.log(`📋 Found ${localTeachers.length} teacher record(s) in local MongoDB.`);

    if (localTeachers.length > 0) {
      for (const teacher of localTeachers) {
        await atlasConn.collection('teachers').updateOne(
          { _id: teacher._id },
          { $set: teacher },
          { upsert: true }
        );
      }
      console.log(`✅ Successfully copied ${localTeachers.length} teacher(s) to Atlas.`);
    }

    // 2. Migrate Students
    console.log('\n🔍 Checking Students collection...');
    const localStudents = await localConn.collection('students').find({}).toArray();
    console.log(`📋 Found ${localStudents.length} student record(s) in local MongoDB.`);

    if (localStudents.length > 0) {
      for (const student of localStudents) {
        await atlasConn.collection('students').updateOne(
          { _id: student._id },
          { $set: student },
          { upsert: true }
        );
      }
      console.log(`✅ Successfully copied ${localStudents.length} student(s) to Atlas.`);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL DATA MIGRATED TO ATLAS SUCCESSFULLY!');
    console.log(`   - Teachers transferred: ${localTeachers.length}`);
    console.log(`   - Students transferred: ${localStudents.length}`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Error during data copy:', error.message);
  } finally {
    await localConn.close();
    await atlasConn.close();
    process.exit(0);
  }
}

migrateData();
