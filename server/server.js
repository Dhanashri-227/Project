import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { TeacherModel } from './models/Teacher.js';
import { StudentModel } from './models/Student.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Fallback Store (active if MongoDB is unavailable)
const inMemoryStore = {
  teachers: [
    {
      id: 'teacher_demo_10a',
      _id: 'teacher_demo_10a',
      name: 'Rajesh Sharma',
      email: 'teacher@school.edu',
      password: 'password123',
      schoolName: 'Delhi Public School',
      assignedClass: 'Class 10',
      assignedSection: 'A',
      subjectSpecialization: 'Mathematics & Science',
      role: 'Class Teacher',
      createdAt: new Date().toISOString(),
    },
  ],
  students: [],
};

const isMongooseConnected = () => mongoose.connection.readyState === 1;

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: isMongooseConnected() ? 'MongoDB' : 'Memory/LocalStore',
    timestamp: new Date().toISOString(),
  });
});

// --- TEACHER AUTHENTICATION APIS ---

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

// Teacher Registration with Unique Classroom Check
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
        schoolName: schoolName?.trim() || 'Academic Institution',
        assignedClass: targetClass,
        assignedSection: targetSection,
        subjectSpecialization: subjectSpecialization?.trim() || 'Class Teacher',
        role: 'Class Teacher',
      });

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
      schoolName: schoolName?.trim() || 'Academic Institution',
      assignedClass: targetClass,
      assignedSection: targetSection,
      subjectSpecialization: subjectSpecialization?.trim() || 'Class Teacher',
      role: 'Class Teacher',
      createdAt: new Date().toISOString(),
    };
    inMemoryStore.teachers.push(newTeacher);

    res.status(201).json({
      success: true,
      message: `Successfully registered as the designated Class Teacher for ${newTeacher.assignedClass} - Section ${newTeacher.assignedSection}!`,
      teacher: newTeacher,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during registration', error: err.message });
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

      // Security PIN validation (strictly 123$rollNo, 1234 is not accepted)
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

// Search Student Result by Roll Number, Class, and Section (for Student Section)
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

      // Find student matching exact criteria
      let student = await StudentModel.findOne(query).sort({ createdAt: -1 });

      // If not found with class/section, try matching rollNo directly
      if (!student && (className || section)) {
        student = await StudentModel.findOne({ rollNo: trimmedRoll }).sort({ createdAt: -1 });
      }

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `No student record found with Roll Number #${trimmedRoll}`,
        });
      }

      // Fetch teacher info if available
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

// Get all schools with their classes, teacher info, and performance summary
app.get('/api/schools', async (req, res) => {
  try {
    let teachers = [];
    let students = [];

    if (isMongooseConnected()) {
      teachers = await TeacherModel.find({}).lean();
      students = await StudentModel.find({}).lean();
    } else {
      teachers = inMemoryStore.teachers;
      students = inMemoryStore.students;
    }

    const schoolMap = new Map();

    // 1. Register classes from all teachers
    teachers.forEach((t) => {
      const sName = (t.schoolName || 'Academic Institution').trim();
      if (!schoolMap.has(sName)) {
        schoolMap.set(sName, {
          schoolName: sName,
          classesMap: new Map(),
          totalStudents: 0,
          passCount: 0,
        });
      }
      const schoolObj = schoolMap.get(sName);
      const classKey = `${t.assignedClass}__${t.assignedSection}`;
      if (!schoolObj.classesMap.has(classKey)) {
        schoolObj.classesMap.set(classKey, {
          className: t.assignedClass,
          section: t.assignedSection,
          teacherId: t._id ? t._id.toString() : t.id,
          teacherName: t.name,
          teacherEmail: t.email,
          studentCount: 0,
          passCount: 0,
          failCount: 0,
          totalPercentage: 0,
        });
      }
    });

    // 2. Distribute and aggregate students
    students.forEach((s) => {
      let matchedTeacher = null;
      if (s.teacherId) {
        matchedTeacher = teachers.find(
          (t) => (t._id && t._id.toString() === s.teacherId.toString()) || t.id === s.teacherId
        );
      }
      const sName = (s.schoolName || matchedTeacher?.schoolName || 'Academic Institution').trim();
      if (!schoolMap.has(sName)) {
        schoolMap.set(sName, {
          schoolName: sName,
          classesMap: new Map(),
          totalStudents: 0,
          passCount: 0,
        });
      }
      const schoolObj = schoolMap.get(sName);
      const classKey = `${s.className}__${s.section}`;
      if (!schoolObj.classesMap.has(classKey)) {
        schoolObj.classesMap.set(classKey, {
          className: s.className,
          section: s.section,
          teacherId: matchedTeacher?._id ? matchedTeacher._id.toString() : s.teacherId,
          teacherName: matchedTeacher?.name || 'Class Teacher',
          teacherEmail: matchedTeacher?.email || s.teacherEmail,
          studentCount: 0,
          passCount: 0,
          failCount: 0,
          totalPercentage: 0,
        });
      }
      const clsObj = schoolObj.classesMap.get(classKey);
      clsObj.studentCount += 1;
      if (s.status === 'Pass') {
        clsObj.passCount += 1;
        schoolObj.passCount += 1;
      } else {
        clsObj.failCount += 1;
      }
      clsObj.totalPercentage += Number(s.percentage || 0);
      schoolObj.totalStudents += 1;
    });

    // 3. Build response list
    const result = Array.from(schoolMap.values()).map((s) => {
      const classes = Array.from(s.classesMap.values())
        .map((c) => ({
          className: c.className,
          section: c.section,
          teacherId: c.teacherId,
          teacherName: c.teacherName,
          teacherEmail: c.teacherEmail,
          studentCount: c.studentCount,
          passCount: c.passCount,
          failCount: c.failCount,
          avgPercentage: c.studentCount > 0 ? Number((c.totalPercentage / c.studentCount).toFixed(1)) : 0,
        }))
        .sort((a, b) => a.className.localeCompare(b.className) || a.section.localeCompare(b.section));

      return {
        schoolName: s.schoolName,
        totalStudents: s.totalStudents,
        totalClasses: classes.length,
        passPercentage: s.totalStudents > 0 ? Number(((s.passCount / s.totalStudents) * 100).toFixed(1)) : 0,
        classes,
      };
    });

    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching schools', error: err.message });
  }
});

// Get all student results for a specific school, class, and section
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

// Add New Student Marks
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
        const t = inMemoryStore.teachers.find((x) => x.id === studentData.teacherId);
        if (t && t.schoolName) studentData.schoolName = t.schoolName;
      }
    }

    if (isMongooseConnected()) {
      const created = await StudentModel.create(studentData);
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
    res.status(201).json({ success: true, message: 'Student marks stored', data: newStudent });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error adding student', error: err.message });
  }
});

// Update Existing Student Marks
app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, ...updateFields } = req.body;

    if (isMongooseConnected()) {
      const query = { _id: id };
      if (teacherId) query.teacherId = teacherId;

      const updated = await StudentModel.findOneAndUpdate(query, updateFields, {
        new: true,
        runValidators: true,
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Student record not found' });
      }

      return res.json({ success: true, message: 'Student marks updated', data: updated });
    }

    // In-Memory Fallback
    const index = inMemoryStore.students.findIndex((s) => s.id === id || s._id === id);
    if (index === -1) {
      const created = { id, _id: id, teacherId, ...updateFields };
      inMemoryStore.students.push(created);
      return res.json({ success: true, message: 'Student marks saved', data: created });
    }

    inMemoryStore.students[index] = {
      ...inMemoryStore.students[index],
      ...updateFields,
    };
    res.json({ success: true, message: 'Student marks updated', data: inMemoryStore.students[index] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating student', error: err.message });
  }
});

// Delete Student Record
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
      return res.json({ success: true, message: 'Student record deleted' });
    }

    // In-Memory Fallback
    inMemoryStore.students = inMemoryStore.students.filter((s) => s.id !== id && s._id !== id);
    res.json({ success: true, message: 'Student record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting student', error: err.message });
  }
});

// Start Server & Connect Database
async function startServer() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Backend server not started because MongoDB is unavailable.');
    process.exitCode = 1;
    return;
  }

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

    // Seed second demo school (Delhi Public School, Class 9-A) if not already present
    const dpsTeacher = await TeacherModel.findOne({ schoolName: 'Delhi Public School' });
    if (!dpsTeacher) {
      const newTeacher = await TeacherModel.create({
        name: 'Dr. Sunita Rao',
        email: 'sunita.rao@dps.edu',
        password: 'password123',
        schoolName: 'Delhi Public School',
        assignedClass: 'Class 9',
        assignedSection: 'A',
        subjectSpecialization: 'Science & Mathematics',
        role: 'Class Teacher',
      });
      await StudentModel.create([
        {
          teacherId: newTeacher._id.toString(),
          teacherEmail: newTeacher.email,
          schoolName: 'Delhi Public School',
          rollNo: '301',
          name: 'Aarav Gupta',
          className: 'Class 9',
          section: 'A',
          gender: 'Male',
          subjects: { maths: 95, science: 92, english: 89, hindi: 88, socialScience: 90 },
          totalMarks: 454,
          maxTotalMarks: 500,
          percentage: 90.8,
          grade: 'A+',
          status: 'Pass',
          remarks: 'Outstanding conceptual clarity.',
          studentPin: '123$301',
        },
        {
          teacherId: newTeacher._id.toString(),
          teacherEmail: newTeacher.email,
          schoolName: 'Delhi Public School',
          rollNo: '302',
          name: 'Diya Sen',
          className: 'Class 9',
          section: 'A',
          gender: 'Female',
          subjects: { maths: 88, science: 85, english: 94, hindi: 91, socialScience: 86 },
          totalMarks: 444,
          maxTotalMarks: 500,
          percentage: 88.8,
          grade: 'A',
          status: 'Pass',
          remarks: 'Excellent in Languages and Science.',
          studentPin: '123$302',
        },
        {
          teacherId: newTeacher._id.toString(),
          teacherEmail: newTeacher.email,
          schoolName: 'Delhi Public School',
          rollNo: '303',
          name: 'Kabir Mehta',
          className: 'Class 9',
          section: 'A',
          gender: 'Male',
          subjects: { maths: 76, science: 70, english: 80, hindi: 75, socialScience: 72 },
          totalMarks: 373,
          maxTotalMarks: 500,
          percentage: 74.6,
          grade: 'B',
          status: 'Pass',
          remarks: 'Good effort, consistent performance.',
          studentPin: '123$303',
        },
      ]);
      console.log('✅ Seeded demo school "Delhi Public School" (Class 9-A) with sample records.');
    }
  } catch (syncErr) {
    console.warn('School sync/seed note:', syncErr.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Express Backend Server running on http://localhost:${PORT}`);
  });
}

startServer();

