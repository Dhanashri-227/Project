import { Student } from '../types/student';

const BASE_STORAGE_KEY = 'student_marks_portal_data_v1';

export const INITIAL_SAMPLE_STUDENTS: Student[] = [
  {
    id: 'sample_student_1',
    teacherId: 'teacher_demo_10a',
    teacherEmail: 'teacher@school.edu',
    rollNo: '101',
    name: 'Aarav Sharma',
    className: 'Class 10',
    section: 'A',
    gender: 'Male',
    subjects: {
      maths: 92,
      science: 95,
      english: 88,
      hindi: 84,
      socialScience: 91,
    },
    totalMarks: 450,
    maxTotalMarks: 500,
    percentage: 90,
    grade: 'A+',
    status: 'Pass',
    remarks: 'Outstanding performance! Consistently top of the class.',
    studentPin: '123$101',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'sample_student_2',
    teacherId: 'teacher_demo_10a',
    teacherEmail: 'teacher@school.edu',
    rollNo: '102',
    name: 'Priya Patel',
    className: 'Class 10',
    section: 'A',
    gender: 'Female',
    subjects: {
      maths: 85,
      science: 89,
      english: 92,
      hindi: 90,
      socialScience: 84,
    },
    totalMarks: 440,
    maxTotalMarks: 500,
    percentage: 88,
    grade: 'A',
    status: 'Pass',
    remarks: 'Excellent comprehension and disciplined coursework.',
    studentPin: '123$102',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'sample_student_3',
    teacherId: 'teacher_demo_10a',
    teacherEmail: 'teacher@school.edu',
    rollNo: '103',
    name: 'Rohan Verma',
    className: 'Class 10',
    section: 'A',
    gender: 'Male',
    subjects: {
      maths: 74,
      science: 68,
      english: 72,
      hindi: 78,
      socialScience: 70,
    },
    totalMarks: 362,
    maxTotalMarks: 500,
    percentage: 72.4,
    grade: 'B',
    status: 'Pass',
    remarks: 'Good progress. Needs to focus a bit more on Science concepts.',
    studentPin: '123$103',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'sample_student_4',
    teacherId: 'teacher_demo_10a',
    teacherEmail: 'teacher@school.edu',
    rollNo: '104',
    name: 'Ananya Gupta',
    className: 'Class 10',
    section: 'A',
    gender: 'Female',
    subjects: {
      maths: 62,
      science: 58,
      english: 65,
      hindi: 70,
      socialScience: 60,
    },
    totalMarks: 315,
    maxTotalMarks: 500,
    percentage: 63,
    grade: 'C',
    status: 'Pass',
    remarks: 'Satisfactory. Regular practice in Maths will improve scores.',
    studentPin: '123$104',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sample_student_5',
    teacherId: 'teacher_demo_10a',
    teacherEmail: 'teacher@school.edu',
    rollNo: '105',
    name: 'Vikram Singh',
    className: 'Class 10',
    section: 'A',
    gender: 'Male',
    subjects: {
      maths: 28,
      science: 45,
      english: 52,
      hindi: 50,
      socialScience: 48,
    },
    totalMarks: 223,
    maxTotalMarks: 500,
    percentage: 44.6,
    grade: 'F',
    status: 'Fail',
    remarks: 'Failed in Mathematics (<33). Needs remedial coaching and re-test.',
    studentPin: '123$105',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export function getTeacherStorageKey(teacherId?: string): string {
  if (!teacherId) return BASE_STORAGE_KEY;
  return `${BASE_STORAGE_KEY}_teacher_${teacherId}`;
}

export function getStoredStudents(teacherId?: string): Student[] {
  try {
    const key = getTeacherStorageKey(teacherId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (teacherId === 'teacher_demo_10a' || !teacherId) {
        saveStoredStudents(INITIAL_SAMPLE_STUDENTS, teacherId);
        return INITIAL_SAMPLE_STUDENTS;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let migrated = false;
      const cleanStudents = parsed.map((s: Student) => {
        if (!s.studentPin || s.studentPin === '1234') {
          migrated = true;
          return { ...s, studentPin: `123$${s.rollNo}` };
        }
        return s;
      });
      if (migrated) {
        saveStoredStudents(cleanStudents, teacherId);
      }
      return cleanStudents;
    }
    return [];
  } catch (err) {
    console.error('Error loading students from localStorage:', err);
    return [];
  }
}

export function saveStoredStudents(students: Student[], teacherId?: string): void {
  try {
    const key = getTeacherStorageKey(teacherId);
    localStorage.setItem(key, JSON.stringify(students));
  } catch (err) {
    console.error('Error saving students to localStorage:', err);
  }
}

export function clearTeacherLocalData(teacherId?: string): Student[] {
  const key = getTeacherStorageKey(teacherId);
  localStorage.removeItem(key);
  return [];
}

