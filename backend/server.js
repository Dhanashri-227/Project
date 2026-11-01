import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import { TeacherModel } from './models/Teacher.js';
import { StudentModel } from './models/Student.js';
import { SchoolModel } from './models/School.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Fallback Store (active if MongoDB is unavailable)
const inMemoryStore = {
  teachers: [],
  students: [],
  schools: [],
};

const isMongooseConnected = () => mongoose.connection.readyState === 1;

// Helper to escape regex special characters
function escapeRegex(text) {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// =========================================================================
// 🏫 SCHOOL SCHEMA SYNCHRONIZATION SERVICE
// The School schema is updated ONLY when a Student is updated/added/deleted
// or when a Teacher performs an action (register/update).
// =========================================================================

// Synchronize School Document for a specific school
async function syncSchoolData(schoolName, actionDescription = 'Data synchronized') {
  if (!schoolName) return null;
  const targetName = schoolName.trim();
  if (!targetName || targetName.toLowerCase() === 'class-result') return null;

  try {
    if (isMongooseConnected()) {
      const nameRegex = new RegExp(`^${escapeRegex(targetName)}$`, 'i');

      // 1. Fetch all teachers for this school
      const teachers = await TeacherModel.find({ schoolName: nameRegex }).lean();
      const teacherIds = teachers.map((t) => t._id.toString());

      // 2. Fetch all students belonging to this school or its registered teachers
      const students = await StudentModel.find({
        $or: [
          { schoolName: nameRegex },
          { teacherId: { $in: teacherIds } },
        ],
      }).lean();

      // 3. Build Class summaries
      const classesMap = new Map();

      // Register classes from teachers
      teachers.forEach((t) => {
        const classKey = `${t.assignedClass}__${t.assignedSection}`;
        if (!classesMap.has(classKey)) {
          classesMap.set(classKey, {
            className: t.assignedClass,
            section: t.assignedSection,
            teacherId: t._id ? t._id.toString() : '',
            teacherName: t.name || 'Class Teacher',
            teacherEmail: t.email || '',
            studentCount: 0,
            passCount: 0,
            failCount: 0,
            avgPercentage: 0,
            _totalPercentage: 0,
          });
        }
      });

      let schoolTotalStudents = 0;
      let schoolPassCount = 0;

      // Aggregate student marks into class summaries
      students.forEach((s) => {
        const classKey = `${s.className}__${s.section}`;
        if (!classesMap.has(classKey)) {
          const matchedTeacher = teachers.find(
            (t) => t._id && t._id.toString() === s.teacherId?.toString()
          );
          classesMap.set(classKey, {
            className: s.className,
            section: s.section,
            teacherId: matchedTeacher?._id ? matchedTeacher._id.toString() : (s.teacherId || ''),
            teacherName: matchedTeacher?.name || 'Class Teacher',
            teacherEmail: matchedTeacher?.email || s.teacherEmail || '',
            studentCount: 0,
            passCount: 0,
            failCount: 0,
            avgPercentage: 0,
            _totalPercentage: 0,
          });
        }

        const cls = classesMap.get(classKey);
        cls.studentCount += 1;
        if (s.status === 'Pass') {
          cls.passCount += 1;
          schoolPassCount += 1;
        } else {
          cls.failCount += 1;
        }
        cls._totalPercentage = (cls._totalPercentage || 0) + Number(s.percentage || 0);
        schoolTotalStudents += 1;
      });

      // Format class list
      const classes = Array.from(classesMap.values())
        .map((c) => ({
          className: c.className,
          section: c.section,
          teacherId: c.teacherId,
          teacherName: c.teacherName,
          teacherEmail: c.teacherEmail,
          studentCount: c.studentCount,
          passCount: c.passCount,
          failCount: c.failCount,
          avgPercentage: c.studentCount > 0 ? Number((c._totalPercentage / c.studentCount).toFixed(1)) : 0,
        }))
        .sort((a, b) => a.className.localeCompare(b.className) || a.section.localeCompare(b.section));

      const passPercentage =
        schoolTotalStudents > 0
          ? Number(((schoolPassCount / schoolTotalStudents) * 100).toFixed(1))
          : 0;

      // 4. Update the School Schema document
      const updatedSchool = await SchoolModel.findOneAndUpdate(
        { schoolName: nameRegex },
        {
          schoolName: targetName,
          totalStudents: schoolTotalStudents,
          totalClasses: classes.length,
          passPercentage,
          classes,
          lastUpdated: new Date(),
          lastAction: actionDescription,
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      console.log(`🏫 [School Schema Updated] "${targetName}" -> Total Students: ${schoolTotalStudents}, Classes: ${classes.length} (Trigger: ${actionDescription})`);
      return updatedSchool;
    }

    // In-Memory Fallback Sync
    return syncSchoolDataInMemory(targetName, actionDescription);
  } catch (err) {
    console.error(`❌ Error updating School schema for "${targetName}":`, err.message);
    return null;
  }
}

// In-Memory Fallback School synchronization
function syncSchoolDataInMemory(schoolName, actionDescription = 'Data synchronized') {
  if (!schoolName) return null;
  const targetName = schoolName.trim();
  const lowerName = targetName.toLowerCase();

  const teachers = inMemoryStore.teachers.filter(
    (t) => (t.schoolName || 'Academic Institution').toLowerCase() === lowerName
  );
  const teacherIds = teachers.map((t) => (t._id ? t._id.toString() : t.id));

  const students = inMemoryStore.students.filter((s) => {
    const sName = (s.schoolName || '').toLowerCase();
    return sName === lowerName || teacherIds.includes(s.teacherId);
  });

  const classesMap = new Map();
  teachers.forEach((t) => {
    const classKey = `${t.assignedClass}__${t.assignedSection}`;
    if (!classesMap.has(classKey)) {
      classesMap.set(classKey, {
        className: t.assignedClass,
        section: t.assignedSection,
        teacherId: t.id || t._id,
        teacherName: t.name || 'Class Teacher',
        teacherEmail: t.email || '',
        studentCount: 0,
        passCount: 0,
        failCount: 0,
        avgPercentage: 0,
        _totalPercentage: 0,
      });
    }
  });

  let schoolTotalStudents = 0;
  let schoolPassCount = 0;

  students.forEach((s) => {
    const classKey = `${s.className}__${s.section}`;
    if (!classesMap.has(classKey)) {
      const matchedTeacher = teachers.find((t) => (t.id || t._id) === s.teacherId);
      classesMap.set(classKey, {
        className: s.className,
        section: s.section,
        teacherId: matchedTeacher?.id || matchedTeacher?._id || s.teacherId || '',
        teacherName: matchedTeacher?.name || 'Class Teacher',
        teacherEmail: matchedTeacher?.email || s.teacherEmail || '',
        studentCount: 0,
        passCount: 0,
        failCount: 0,
        avgPercentage: 0,
        _totalPercentage: 0,
      });
    }

    const cls = classesMap.get(classKey);
    cls.studentCount += 1;
    if (s.status === 'Pass') {
      cls.passCount += 1;
      schoolPassCount += 1;
    } else {
      cls.failCount += 1;
    }
    cls._totalPercentage = (cls._totalPercentage || 0) + Number(s.percentage || 0);
    schoolTotalStudents += 1;
  });

  const classes = Array.from(classesMap.values())
    .map((c) => ({
      className: c.className,
      section: c.section,
      teacherId: c.teacherId,
      teacherName: c.teacherName,
      teacherEmail: c.teacherEmail,
      studentCount: c.studentCount,
      passCount: c.passCount,
      failCount: c.failCount,
      avgPercentage: c.studentCount > 0 ? Number((c._totalPercentage / c.studentCount).toFixed(1)) : 0,
    }))
    .sort((a, b) => a.className.localeCompare(b.className) || a.section.localeCompare(b.section));

  const passPercentage =
    schoolTotalStudents > 0
      ? Number(((schoolPassCount / schoolTotalStudents) * 100).toFixed(1))
      : 0;

  const schoolObj = {
    id: `school_${targetName.replace(/\s+/g, '_')}`,
    _id: `school_${targetName.replace(/\s+/g, '_')}`,
    schoolName: targetName,
    totalStudents: schoolTotalStudents,
    totalClasses: classes.length,
    passPercentage,
    classes,
    lastUpdated: new Date().toISOString(),
    lastAction: actionDescription,
  };

  const existingIdx = inMemoryStore.schools.findIndex(
    (s) => s.schoolName.toLowerCase() === lowerName
  );
  if (existingIdx >= 0) {
    inMemoryStore.schools[existingIdx] = schoolObj;
  } else {
    inMemoryStore.schools.push(schoolObj);
  }

  return schoolObj;
}

// Synchronize all schools (initial server startup or data migration)
async function syncAllSchools(actionDescription = 'Full synchronization') {
  try {
    const schoolNamesSet = new Set();

    if (isMongooseConnected()) {
      // Clean up any accidental 'class-result' document
      try {
        await SchoolModel.deleteMany({ schoolName: /^class-result$/i });
      } catch (cleanErr) {
        // ignore
      }

      const teachers = await TeacherModel.find({}, 'schoolName').lean();
      teachers.forEach((t) => {
        const sName = t.schoolName?.trim();
        if (sName && sName.toLowerCase() !== 'class-result') schoolNamesSet.add(sName);
      });

      const students = await StudentModel.find({}, 'schoolName').lean();
      students.forEach((s) => {
        const sName = s.schoolName?.trim();
        if (sName && sName.toLowerCase() !== 'class-result') schoolNamesSet.add(sName);
      });

      const existingSchools = await SchoolModel.find({}, 'schoolName').lean();
      existingSchools.forEach((sc) => {
        const sName = sc.schoolName?.trim();
        if (sName && sName.toLowerCase() !== 'class-result') schoolNamesSet.add(sName);
      });

      if (schoolNamesSet.size === 0) {
        schoolNamesSet.add('Academic Institution');
      }

      for (const name of schoolNamesSet) {
        await syncSchoolData(name, actionDescription);
      }
      console.log(`✅ [School Sync Complete] Initialized ${schoolNamesSet.size} school(s) in School collection.`);
    } else {
      inMemoryStore.schools = inMemoryStore.schools.filter((s) => s.schoolName.toLowerCase() !== 'class-result');
      inMemoryStore.teachers.forEach((t) => {
        const sName = t.schoolName?.trim();
        if (sName && sName.toLowerCase() !== 'class-result') schoolNamesSet.add(sName);
      });
      inMemoryStore.students.forEach((s) => {
        const sName = s.schoolName?.trim();
        if (sName && sName.toLowerCase() !== 'class-result') schoolNamesSet.add(sName);
      });
      if (schoolNamesSet.size === 0) {
        schoolNamesSet.add('Academic Institution');
      }
      for (const name of schoolNamesSet) {
        syncSchoolDataInMemory(name, actionDescription);
      }
    }
  } catch (err) {
    console.error('Error during syncAllSchools:', err.message);
  }
}

// =========================================================================
// 🚀 API ROUTES
// =========================================================================

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: isMongooseConnected() ? 'MongoDB' : 'Memory/LocalStore',
    timestamp: new Date().toISOString(),
  });
});

// --- TEACHER AUTHENTICATION & MANAGEMENT APIS ---

// Teacher Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isMongooseConnected()) {
      const teacher = await TeacherModel.findOne({
        email: normalizedEmail,
        password,
      });

      if (!teacher) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password. Please check your credentials or register a new account.',
        });
      }

      return res.json({
        success: true,
        message: `Welcome back, ${teacher.name}!`,
        teacher,
      });
    }

    // In-Memory Fallback
    const teacher = inMemoryStore.teachers.find(
      (t) => t.email.toLowerCase() === normalizedEmail && t.password === password
    );

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    res.json({
      success: true,
      message: `Welcome back, ${teacher.name}!`,
      teacher,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login', error: err.message });
  }
});

// Teacher Registration with Unique Classroom Check & School Schema Update
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, schoolName, assignedClass, assignedSection, subjectSpecialization } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const targetClass = assignedClass || 'Class 10';
    const targetSection = assignedSection || 'A';
    const normalizedEmail = email.trim().toLowerCase();
    const finalSchoolName = schoolName?.trim() || 'Academic Institution';

    if (isMongooseConnected()) {
      // 1. Check if email is already in use
      const existingEmail = await TeacherModel.findOne({ email: normalizedEmail });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'A teacher account with this email address already exists. Please sign in.',
        });
      }

      // 2. Enforce Rule: Only 1 Class Teacher per Classroom
      const existingClassTeacher = await TeacherModel.findOne({
        assignedClass: targetClass,
        assignedSection: targetSection,
      });

      if (existingClassTeacher) {
        return res.status(400).json({
          success: false,
          message: `Class Teacher for ${targetClass} - Section ${targetSection} is already assigned (${existingClassTeacher.name}). Only one teacher can be assigned per classroom.`,
        });
      }

      const newTeacher = await TeacherModel.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        schoolName: finalSchoolName,
        assignedClass: targetClass,
        assignedSection: targetSection,
        subjectSpecialization: subjectSpecialization?.trim() || 'Class Teacher',
        role: 'Class Teacher',
      });

      // 🎯 UPDATE SCHOOL SCHEMA ON TEACHER ACTION
      await syncSchoolData(
        newTeacher.schoolName,
        `Teacher registered: ${newTeacher.name} (${newTeacher.assignedClass} - ${newTeacher.assignedSection})`
      );

      return res.status(201).json({
        success: true,
        message: `Successfully registered as the designated Class Teacher for ${newTeacher.assignedClass} - Section ${newTeacher.assignedSection}!`,
        teacher: newTeacher,
      });
    }

    // In-Memory Fallback
    const existingEmail = inMemoryStore.teachers.find((t) => t.email.toLowerCase() === normalizedEmail);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'A teacher account with this email address already exists.',
      });
    }

    const newTeacher = {
      id: `teacher_${Date.now()}`,
      _id: `teacher_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      schoolName: finalSchoolName,
      assignedClass: targetClass,
      assignedSection: targetSection,
      subjectSpecialization: subjectSpecialization?.trim() || 'Class Teacher',
      role: 'Class Teacher',
      createdAt: new Date().toISOString(),
    };
    inMemoryStore.teachers.push(newTeacher);

    // 🎯 UPDATE SCHOOL SCHEMA IN FALLBACK
    syncSchoolDataInMemory(
      newTeacher.schoolName,
      `Teacher registered: ${newTeacher.name} (${newTeacher.assignedClass} - ${newTeacher.assignedSection})`
    );

    res.status(201).json({
      success: true,
      message: `Successfully registered as the designated Class Teacher for ${newTeacher.assignedClass} - Section ${newTeacher.assignedSection}!`,
      teacher: newTeacher,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during registration', error: err.message });
  }
});

// Teacher Profile Update (Updates teacher and triggers School schema update)
app.put('/api/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, schoolName, assignedClass, assignedSection, subjectSpecialization } = req.body;

    if (isMongooseConnected()) {
      const previous = await TeacherModel.findById(id);
      if (!previous) {
        return res.status(404).json({ success: false, message: 'Teacher record not found' });
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (schoolName) updateData.schoolName = schoolName.trim();
      if (assignedClass) updateData.assignedClass = assignedClass.trim();
      if (assignedSection) updateData.assignedSection = assignedSection.trim();
      if (subjectSpecialization) updateData.subjectSpecialization = subjectSpecialization.trim();

      const updated = await TeacherModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });

      // 🎯 UPDATE SCHOOL SCHEMA ON TEACHER ACTION
      await syncSchoolData(updated.schoolName, `Teacher updated: ${updated.name}`);
      if (previous.schoolName && previous.schoolName.toLowerCase() !== updated.schoolName.toLowerCase()) {
        await syncSchoolData(previous.schoolName, `Teacher reassigned: ${updated.name}`);
      }

      return res.json({ success: true, message: 'Teacher updated successfully', teacher: updated });
    }

    // In-Memory Fallback
    const index = inMemoryStore.teachers.findIndex((t) => t.id === id || t._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Teacher record not found' });
    }

    const previous = inMemoryStore.teachers[index];
    inMemoryStore.teachers[index] = { ...previous, ...req.body };
    const updated = inMemoryStore.teachers[index];

    syncSchoolDataInMemory(updated.schoolName, `Teacher updated: ${updated.name}`);
    if (previous.schoolName && previous.schoolName.toLowerCase() !== updated.schoolName.toLowerCase()) {
      syncSchoolDataInMemory(previous.schoolName, `Teacher reassigned: ${updated.name}`);
    }

    res.json({ success: true, message: 'Teacher updated successfully', teacher: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating teacher', error: err.message });
  }
});

// --- STUDENT AUTHENTICATION & LOGIN ---

// Secure Student Login with Roll No, Class, Section, and PIN
app.post('/api/students/auth/login', async (req, res) => {
  try {
    const { rollNo, className, section, pin } = req.body;
    if (!rollNo) {
      return res.status(400).json({ success: false, message: 'Roll number is required' });
    }

    const trimmedRoll = String(rollNo).trim();
    const defaultExpectedPin = `123$${trimmedRoll}`;
    const enteredPin = pin ? String(pin).trim() : '';

    if (isMongooseConnected()) {
      const query = { rollNo: trimmedRoll };
      if (className) query.className = className;
      if (section) query.section = section;

      let student = await StudentModel.findOne(query).sort({ createdAt: -1 });
      if (!student && (className || section)) {
        student = await StudentModel.findOne({ rollNo: trimmedRoll }).sort({ createdAt: -1 });
      }

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `No student record found with Roll Number #${trimmedRoll}. Please check your credentials.`,
        });
      }

      // Security PIN validation (strictly 123$rollNo)
      const expectedPin = (student.studentPin && student.studentPin !== '1234')
        ? student.studentPin
        : defaultExpectedPin;

      if (enteredPin !== expectedPin) {
        return res.status(401).json({
          success: false,
          message: `Invalid Security PIN. Your PIN is 123$${student.rollNo}`,
        });
      }

      let teacherInfo = null;
      if (student.teacherId) {
        teacherInfo = await TeacherModel.findOne({ _id: student.teacherId });
      }

      return res.json({
        success: true,
        message: `Welcome back, ${student.name}!`,
        data: student,
        teacher: teacherInfo,
      });
    }

    // In-Memory Fallback
    let student = inMemoryStore.students.find(
      (s) =>
        s.rollNo === trimmedRoll &&
        (!className || s.className === className) &&
        (!section || s.section === section)
    );
    if (!student) {
      student = inMemoryStore.students.find((s) => s.rollNo === trimmedRoll);
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student record found with Roll Number #${trimmedRoll}.`,
      });
    }

    const expectedPin = (student.studentPin && student.studentPin !== '1234')
      ? student.studentPin
      : defaultExpectedPin;

    if (enteredPin !== expectedPin) {
      return res.status(401).json({
        success: false,
        message: `Invalid Security PIN. Your PIN is 123$${student.rollNo}`,
      });
    }

    const teacherInfo = inMemoryStore.teachers.find(
      (t) => t.id === student.teacherId || t._id === student.teacherId
    );
    res.json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      data: student,
      teacher: teacherInfo,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during student login', error: err.message });
  }
});

// Search Student Result by Roll Number, Class, and Section
app.get('/api/students/result/search', async (req, res) => {
  try {
    const { rollNo, className, section } = req.query;
    if (!rollNo) {
      return res.status(400).json({ success: false, message: 'Roll number is required' });
    }

    const trimmedRoll = String(rollNo).trim();

    if (isMongooseConnected()) {
      const query = { rollNo: trimmedRoll };
      if (className) query.className = className;
      if (section) query.section = section;

      let student = await StudentModel.findOne(query).sort({ createdAt: -1 });
      if (!student && (className || section)) {
        student = await StudentModel.findOne({ rollNo: trimmedRoll }).sort({ createdAt: -1 });
      }

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `No student record found with Roll Number #${trimmedRoll}`,
        });
      }

      let teacherInfo = null;
      if (student.teacherId) {
        teacherInfo = await TeacherModel.findOne({ _id: student.teacherId });
      }

      return res.json({ success: true, data: student, teacher: teacherInfo });
    }

    // In-Memory Fallback
    let student = inMemoryStore.students.find(
      (s) =>
        s.rollNo === trimmedRoll &&
        (!className || s.className === className) &&
        (!section || s.section === section)
    );
    if (!student) {
      student = inMemoryStore.students.find((s) => s.rollNo === trimmedRoll);
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student record found with Roll Number #${trimmedRoll}`,
      });
    }

    const teacherInfo = inMemoryStore.teachers.find(
      (t) => t.id === student.teacherId || t._id === student.teacherId
    );
    res.json({ success: true, data: student, teacher: teacherInfo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error finding student result', error: err.message });
  }
});

// --- SCHOOL & CLASS RESULTS PORTAL APIS ---

// Get all schools directly from School collection (pre-computed, high performance)
app.get('/api/schools', async (req, res) => {
  try {
    if (isMongooseConnected()) {
      let schools = await SchoolModel.find({}).sort({ schoolName: 1 }).lean();

      // If School collection is empty but database has records, perform one-time auto-sync
      if (schools.length === 0) {
        await syncAllSchools('Initial Collection Initialization');
        schools = await SchoolModel.find({}).sort({ schoolName: 1 }).lean();
      }

      return res.json({ success: true, count: schools.length, data: schools });
    }

    // In-Memory Fallback
    if (inMemoryStore.schools.length === 0 && (inMemoryStore.teachers.length > 0 || inMemoryStore.students.length > 0)) {
      await syncAllSchools('Initial Memory Initialization');
    }
    res.json({ success: true, count: inMemoryStore.schools.length, data: inMemoryStore.schools });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching schools', error: err.message });
  }
});

// Get all student results for a specific school, class, and section (Registered before :schoolName)
app.get('/api/schools/class-result', async (req, res) => {
  try {
    const { schoolName, className, section } = req.query;
    if (!className || !section) {
      return res.status(400).json({ success: false, message: 'Class name and section are required' });
    }

    let teachers = [];
    let students = [];

    if (isMongooseConnected()) {
      teachers = await TeacherModel.find({}).lean();
      students = await StudentModel.find({ className, section }).lean();
    } else {
      teachers = inMemoryStore.teachers;
      students = inMemoryStore.students.filter((s) => s.className === className && s.section === section);
    }

    // Match teacher for this school and class
    let matchedTeacher = null;
    if (schoolName) {
      matchedTeacher = teachers.find(
        (t) =>
          t.assignedClass === className &&
          t.assignedSection === section &&
          t.schoolName?.toLowerCase() === schoolName.toLowerCase()
      );
    }
    if (!matchedTeacher) {
      matchedTeacher = teachers.find(
        (t) => t.assignedClass === className && t.assignedSection === section
      );
    }

    // Filter students by school if schoolName provided
    const filteredStudents = students
      .filter((s) => {
        if (!schoolName) return true;
        if (s.schoolName && s.schoolName.toLowerCase() === schoolName.toLowerCase()) return true;
        if (matchedTeacher && (s.teacherId === matchedTeacher._id?.toString() || s.teacherId === matchedTeacher.id)) {
          return true;
        }
        return false;
      })
      .map((s) => ({
        ...s,
        id: s._id ? s._id.toString() : s.id,
      }))
      .sort((a, b) => {
        const rA = parseInt(a.rollNo, 10);
        const rB = parseInt(b.rollNo, 10);
        if (!isNaN(rA) && !isNaN(rB)) return rA - rB;
        return String(a.rollNo).localeCompare(String(b.rollNo));
      });

    res.json({
      success: true,
      schoolName: schoolName || matchedTeacher?.schoolName || 'Academic Institution',
      className,
      section,
      teacher: matchedTeacher || null,
      count: filteredStudents.length,
      data: filteredStudents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching class results', error: err.message });
  }
});

// Get individual school details by school name
app.get('/api/schools/:schoolName', async (req, res, next) => {
  try {
    const { schoolName } = req.params;
    if (!schoolName || schoolName.toLowerCase() === 'class-result') {
      return next();
    }

    const nameRegex = new RegExp(`^${escapeRegex(schoolName.trim())}$`, 'i');

    if (isMongooseConnected()) {
      let school = await SchoolModel.findOne({ schoolName: nameRegex }).lean();
      if (!school) {
        await syncSchoolData(schoolName, 'On-demand lookup sync');
        school = await SchoolModel.findOne({ schoolName: nameRegex }).lean();
      }
      if (!school) {
        return res.status(404).json({ success: false, message: `School "${schoolName}" not found` });
      }
      return res.json({ success: true, data: school });
    }

    const school = inMemoryStore.schools.find((s) => s.schoolName.toLowerCase() === schoolName.trim().toLowerCase());
    if (!school) {
      return res.status(404).json({ success: false, message: `School "${schoolName}" not found` });
    }
    res.json({ success: true, data: school });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching school details', error: err.message });
  }
});

// --- STUDENT CRUD APIS ---

// Get Students for logged-in teacher
app.get('/api/students', async (req, res) => {
  try {
    const { teacherId, className, section } = req.query;
    if (!teacherId) {
      return res.json({ success: true, count: 0, data: [] });
    }

    if (isMongooseConnected()) {
      const filter = { teacherId };
      if (className) filter.className = className;
      if (section) filter.section = section;

      const students = await StudentModel.find(filter).sort({ rollNo: 1, createdAt: -1 });
      return res.json({ success: true, count: students.length, data: students });
    }

    // In-Memory Fallback
    const students = inMemoryStore.students.filter((s) => s.teacherId === teacherId);
    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching students', error: err.message });
  }
});

// Add New Student Marks & Trigger School Schema Update
app.post('/api/students', async (req, res) => {
  try {
    const studentData = req.body;
    if (!studentData.teacherId) {
      return res.status(400).json({ success: false, message: 'Teacher ID is required to record marks' });
    }
    if (!studentData.rollNo || !studentData.name) {
      return res.status(400).json({ success: false, message: 'Roll number and student name are required' });
    }

    if (!studentData.studentPin && studentData.rollNo) {
      studentData.studentPin = `123$${String(studentData.rollNo).trim()}`;
    }

    if (!studentData.schoolName && studentData.teacherId) {
      if (isMongooseConnected()) {
        const t = await TeacherModel.findById(studentData.teacherId);
        if (t && t.schoolName) studentData.schoolName = t.schoolName;
      } else {
        const t = inMemoryStore.teachers.find((x) => x.id === studentData.teacherId || x._id === studentData.teacherId);
        if (t && t.schoolName) studentData.schoolName = t.schoolName;
      }
    }

    if (!studentData.schoolName) {
      studentData.schoolName = 'Academic Institution';
    }

    if (isMongooseConnected()) {
      const created = await StudentModel.create(studentData);

      // 🎯 UPDATE SCHOOL SCHEMA ON STUDENT ADD
      await syncSchoolData(
        created.schoolName,
        `Student added: ${created.name} (Roll ${created.rollNo}) in ${created.className}-${created.section}`
      );

      return res.status(201).json({ success: true, message: 'Student marks stored in database', data: created });
    }

    // In-Memory Fallback
    const newStudent = {
      ...studentData,
      id: studentData.id || `student_${Date.now()}`,
      _id: studentData.id || `student_${Date.now()}`,
      createdAt: studentData.createdAt || new Date().toISOString(),
    };
    inMemoryStore.students.unshift(newStudent);

    // 🎯 UPDATE SCHOOL SCHEMA IN FALLBACK
    syncSchoolDataInMemory(
      newStudent.schoolName,
      `Student added: ${newStudent.name} (Roll ${newStudent.rollNo})`
    );

    res.status(201).json({ success: true, message: 'Student marks stored', data: newStudent });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error adding student', error: err.message });
  }
});

// Update Existing Student Marks & Trigger School Schema Update
app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, ...updateFields } = req.body;

    if (isMongooseConnected()) {
      const query = { _id: id };
      if (teacherId) query.teacherId = teacherId;

      const previous = await StudentModel.findOne(query);
      if (!previous) {
        return res.status(404).json({ success: false, message: 'Student record not found' });
      }

      const previousSchoolName = previous.schoolName;

      const updated = await StudentModel.findOneAndUpdate(query, updateFields, {
        returnDocument: 'after',
        runValidators: true,
      });

      // 🎯 UPDATE SCHOOL SCHEMA ON STUDENT UPDATE
      await syncSchoolData(
        updated.schoolName,
        `Student updated: ${updated.name} (Roll ${updated.rollNo})`
      );

      // If student was moved between schools, update previous school as well
      if (previousSchoolName && previousSchoolName.toLowerCase() !== updated.schoolName.toLowerCase()) {
        await syncSchoolData(
          previousSchoolName,
          `Student transferred: ${updated.name}`
        );
      }

      return res.json({ success: true, message: 'Student marks updated', data: updated });
    }

    // In-Memory Fallback
    const index = inMemoryStore.students.findIndex((s) => s.id === id || s._id === id);
    if (index === -1) {
      const created = { id, _id: id, teacherId, ...updateFields };
      inMemoryStore.students.push(created);
      syncSchoolDataInMemory(created.schoolName, `Student created: ${created.name}`);
      return res.json({ success: true, message: 'Student marks saved', data: created });
    }

    const previousSchool = inMemoryStore.students[index].schoolName;
    inMemoryStore.students[index] = {
      ...inMemoryStore.students[index],
      ...updateFields,
    };
    const updated = inMemoryStore.students[index];

    // 🎯 UPDATE SCHOOL SCHEMA IN FALLBACK
    syncSchoolDataInMemory(updated.schoolName, `Student updated: ${updated.name}`);
    if (previousSchool && previousSchool.toLowerCase() !== updated.schoolName.toLowerCase()) {
      syncSchoolDataInMemory(previousSchool, `Student transferred: ${updated.name}`);
    }

    res.json({ success: true, message: 'Student marks updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating student', error: err.message });
  }
});

// Delete Student Record & Trigger School Schema Update
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.query;

    if (isMongooseConnected()) {
      const query = { _id: id };
      if (teacherId) query.teacherId = teacherId;

      const deleted = await StudentModel.findOneAndDelete(query);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Student record not found' });
      }

      // 🎯 UPDATE SCHOOL SCHEMA ON STUDENT DELETION
      await syncSchoolData(
        deleted.schoolName,
        `Student deleted: ${deleted.name} (Roll ${deleted.rollNo})`
      );

      return res.json({ success: true, message: 'Student record deleted' });
    }

    // In-Memory Fallback
    const target = inMemoryStore.students.find((s) => s.id === id || s._id === id);
    inMemoryStore.students = inMemoryStore.students.filter((s) => s.id !== id && s._id !== id);

    if (target) {
      syncSchoolDataInMemory(target.schoolName, `Student deleted: ${target.name}`);
    }

    res.json({ success: true, message: 'Student record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting student', error: err.message });
  }
});

// Serve frontend static assets in production or when dist folder exists
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Catch-all route handler for SPA (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start Server & Connect Database
async function startServer() {
  const connected = await connectDB();
  if (connected) {
    // Automatic PIN migration: update any student with '1234' or missing pin to 123$<rollNo>
    try {
      const legacyStudents = await StudentModel.find({
        $or: [
          { studentPin: '1234' },
          { studentPin: '' },
          { studentPin: { $exists: false } },
        ],
      });
      for (const s of legacyStudents) {
        if (s.rollNo) {
          s.studentPin = `123$${s.rollNo}`;
          await s.save();
        }
      }
      if (legacyStudents.length > 0) {
        console.log(`✅ Migrated ${legacyStudents.length} student PIN(s) in MongoDB to 123$<rollNo> format.`);
      }
    } catch (migErr) {
      console.warn('PIN migration check skipped:', migErr.message);
    }

    // Automatic migration: sync schoolName from teachers to students
    try {
      const allTeachers = await TeacherModel.find({});
      for (const t of allTeachers) {
        if (t.schoolName) {
          await StudentModel.updateMany(
            { teacherId: t._id.toString(), $or: [{ schoolName: '' }, { schoolName: { $exists: false } }] },
            { $set: { schoolName: t.schoolName } }
          );
        }
      }
    } catch (syncErr) {
      console.warn('School sync note:', syncErr.message);
    }

    // Initialize/Sync all schools into School Schema
    try {
      await syncAllSchools('Server startup initialization');
    } catch (schoolInitErr) {
      console.warn('School schema startup sync note:', schoolInitErr.message);
    }
  } else {
    console.warn('⚠️ Server started in resilient fallback mode (MongoDB not connected).');
    console.warn('💡 If using MongoDB Atlas, verify your IP is allowed in Atlas Network Access tab (or add 0.0.0.0/0).');
    try {
      await syncAllSchools('Fallback memory startup initialization');
    } catch (err) {
      // ignore
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Express Backend Server running on http://localhost:${PORT}`);
  });
}

startServer();
