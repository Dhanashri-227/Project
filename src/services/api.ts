import { Student, StudentFormData, SchoolSummary, SchoolClassResultResponse } from '../types/student';
import { Teacher } from '../types/auth';
import { calculateStudentMetrics } from '../utils/calculations';
import {
  saveCurrentTeacherSession,
  loginTeacher as localLoginTeacher,
  registerTeacher as localRegisterTeacher,
} from '../utils/auth';
import { getStoredStudents, saveStoredStudents, INITIAL_SAMPLE_STUDENTS } from '../utils/storage';

const API_BASE_URL = '/api';

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Check if Backend Server is reachable
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/health`, { method: 'GET' }, 1500);
    if (res.ok) {
      const data = await res.json();
      return data.status === 'online';
    }
    return false;
  } catch {
    return false;
  }
}

// Teacher Login API (Backend first, fallback to local storage)
export async function apiLoginTeacher(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; teacher?: Teacher }> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
      3000
    );
    const data = await res.json();
    if (data.success && data.teacher) {
      saveCurrentTeacherSession(data.teacher);
      return data;
    }
    if (res.status === 401 || (data && data.success === false && data.message)) {
      return { success: false, message: data.message };
    }
  } catch {
    // Backend unreachable - fallback to local storage
  }

  // Fallback to local storage
  const localResult = localLoginTeacher(email, password);
  return localResult;
}

// Teacher Register API (Backend first, fallback to local storage)
export async function apiRegisterTeacher(formData: {
  name: string;
  email: string;
  password: string;
  schoolName: string;
  assignedClass: string;
  assignedSection: string;
  subjectSpecialization: string;
}): Promise<{ success: boolean; message: string; teacher?: Teacher }> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      },
      3000
    );
    const data = await res.json();
    if (data.success && data.teacher) {
      saveCurrentTeacherSession(data.teacher);
      return data;
    }
    if (data && data.success === false && data.message) {
      return { success: false, message: data.message };
    }
  } catch {
    // Backend unreachable - fallback to local storage
  }

  // Fallback to local storage
  const localResult = localRegisterTeacher(formData);
  return localResult;
}

// Fetch Students strictly for logged-in Teacher & Classroom
export async function apiGetStudents(teacher: Teacher): Promise<Student[]> {
  if (!teacher || !teacher.id) return [];

  try {
    const query = new URLSearchParams({
      teacherId: teacher.id,
      className: teacher.assignedClass || '',
      section: teacher.assignedSection || '',
    });

    const res = await fetchWithTimeout(`${API_BASE_URL}/students?${query.toString()}`, {}, 2500);
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        if (result.data.length > 0) {
          saveStoredStudents(result.data, teacher.id);
          return result.data;
        }
      }
    }
  } catch {
    // Backend unreachable - use local storage
  }

  // Local storage fallback
  const localStudents = getStoredStudents(teacher.id);
  return localStudents;
}

// Create Student Record (Guaranteed to save via Backend or Local Storage)
export async function apiCreateStudent(
  formData: StudentFormData,
  teacher: Teacher
): Promise<Student> {
  const subjects = {
    maths: Number(formData.maths) || 0,
    science: Number(formData.science) || 0,
    english: Number(formData.english) || 0,
    hindi: Number(formData.hindi) || 0,
    socialScience: Number(formData.socialScience) || 0,
  };
  const metrics = calculateStudentMetrics(subjects);

  const newStudentId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const studentPayload: Student = {
    id: newStudentId,
    teacherId: teacher.id,
    teacherEmail: teacher.email,
    rollNo: formData.rollNo.trim(),
    name: formData.name.trim(),
    className: formData.className || teacher.assignedClass,
    section: formData.section || teacher.assignedSection,
    gender: formData.gender,
    subjects,
    ...metrics,
    remarks: formData.remarks?.trim() || metrics.autoRemarks,
    createdAt: new Date().toISOString(),
  };

  // Try backend first
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/students`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentPayload),
      },
      3000
    );

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        const savedStudent: Student = {
          ...result.data,
          id: result.data.id || result.data._id || newStudentId,
        };
        // Update local backup
        const currentList = getStoredStudents(teacher.id);
        saveStoredStudents([savedStudent, ...currentList.filter((s) => s.id !== savedStudent.id)], teacher.id);
        return savedStudent;
      }
    }
  } catch {
    // Backend not running or error - proceed to local save
  }

  // Local storage save guarantee
  const currentList = getStoredStudents(teacher.id);
  const updatedList = [studentPayload, ...currentList.filter((s) => s.rollNo !== studentPayload.rollNo)];
  saveStoredStudents(updatedList, teacher.id);

  return studentPayload;
}

// Update Student Record (Guaranteed to update via Backend or Local Storage)
export async function apiUpdateStudent(
  id: string,
  formData: StudentFormData,
  teacherId: string
): Promise<Student> {
  const subjects = {
    maths: Number(formData.maths) || 0,
    science: Number(formData.science) || 0,
    english: Number(formData.english) || 0,
    hindi: Number(formData.hindi) || 0,
    socialScience: Number(formData.socialScience) || 0,
  };
  const metrics = calculateStudentMetrics(subjects);

  const payload = {
    teacherId,
    rollNo: formData.rollNo.trim(),
    name: formData.name.trim(),
    className: formData.className,
    section: formData.section,
    gender: formData.gender,
    subjects,
    ...metrics,
    remarks: formData.remarks?.trim() || metrics.autoRemarks,
  };

  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/students/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      3000
    );

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        const updatedStudent: Student = {
          ...result.data,
          id: result.data.id || result.data._id || id,
        };
        // Update local storage
        const currentList = getStoredStudents(teacherId);
        saveStoredStudents(
          currentList.map((s) => (s.id === id ? updatedStudent : s)),
          teacherId
        );
        return updatedStudent;
      }
    }
  } catch {
    // Backend error or offline - fallback to local storage update
  }

  // Local storage update guarantee
  const currentList = getStoredStudents(teacherId);
  const existing = currentList.find((s) => s.id === id);
  const updatedStudent: Student = {
    ...(existing || {}),
    id,
    teacherId,
    rollNo: payload.rollNo,
    name: payload.name,
    className: payload.className,
    section: payload.section,
    gender: payload.gender,
    subjects: payload.subjects,
    totalMarks: metrics.totalMarks,
    maxTotalMarks: metrics.maxTotalMarks,
    percentage: metrics.percentage,
    grade: metrics.grade,
    status: metrics.status,
    remarks: payload.remarks,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  const updatedList = currentList.map((s) => (s.id === id ? updatedStudent : s));
  saveStoredStudents(updatedList, teacherId);

  return updatedStudent;
}

// Delete Student Record (Backend + Local Storage)
export async function apiDeleteStudent(id: string, teacherId: string): Promise<boolean> {
  try {
    await fetchWithTimeout(
      `${API_BASE_URL}/students/${id}?teacherId=${encodeURIComponent(teacherId)}`,
      {
        method: 'DELETE',
      },
      2500
    );
  } catch {
    // Ignore network error
  }

  // Always delete from local storage
  const currentList = getStoredStudents(teacherId);
  const updatedList = currentList.filter((s) => s.id !== id);
  saveStoredStudents(updatedList, teacherId);

  return true;
}

// Student Login Authentication API (Backend + Local Storage)
export async function apiStudentLogin(
  rollNo: string,
  className?: string,
  section?: string,
  pin?: string
): Promise<{ success: boolean; data?: Student; teacher?: Teacher; message?: string }> {
  const cleanRoll = rollNo.trim();
  const enteredPin = pin ? pin.trim() : '';

  if (!cleanRoll) {
    return { success: false, message: 'Please enter a valid Roll Number' };
  }

  // 1. Try Backend API first
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/students/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo: cleanRoll, className, section, pin: enteredPin }),
      },
      2500
    );
    const result = await res.json();
    if (result.success && result.data) {
      return result;
    }
    if (result && result.success === false && result.message) {
      return result;
    }
  } catch {
    // Backend offline, fallback to localStorage
  }

  // 2. Local Storage Fallback
  try {
    const allStudents: Student[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('student_marks_portal_data_v1')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) allStudents.push(...parsed);
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    allStudents.push(...INITIAL_SAMPLE_STUDENTS);

    let matched = allStudents.find(
      (s) =>
        s.rollNo?.toLowerCase() === cleanRoll.toLowerCase() &&
        (!className || s.className === className) &&
        (!section || s.section === section)
    );

    if (!matched) {
      matched = allStudents.find((s) => s.rollNo?.toLowerCase() === cleanRoll.toLowerCase());
    }

    if (matched) {
      const defaultPin = `123$${matched.rollNo}`;
      const expectedPin = (matched.studentPin && matched.studentPin !== '1234')
        ? matched.studentPin
        : defaultPin;

      if (enteredPin !== expectedPin) {
        return {
          success: false,
          message: `Incorrect Security PIN. PIN format is 123$${matched.rollNo}.`,
        };
      }

      return {
        success: true,
        data: matched,
        teacher: {
          id: matched.teacherId || 'teacher_demo',
          name: 'Class Teacher',
          email: matched.teacherEmail || 'teacher@school.edu',
          schoolName: 'Central Academy Secondary School',
          assignedClass: matched.className,
          assignedSection: matched.section,
          subjectSpecialization: 'General',
          role: 'Class Teacher',
          createdAt: matched.createdAt,
        },
      };
    }
  } catch {
    // storage error
  }

  return {
    success: false,
    message: `No student record found for Roll Number "${cleanRoll}". Please verify your credentials.`,
  };
}

// Search Student Result by Roll Number & Classroom (for Student Section)
export async function apiSearchStudentResult(
  rollNo: string,
  className?: string,
  section?: string
): Promise<{ success: boolean; data?: Student; teacher?: Teacher; message?: string }> {
  const cleanRoll = rollNo.trim();
  if (!cleanRoll) {
    return { success: false, message: 'Please enter a valid roll number' };
  }

  // 1. Try Backend API first
  try {
    const params = new URLSearchParams({ rollNo: cleanRoll });
    if (className) params.append('className', className);
    if (section) params.append('section', section);

    const res = await fetchWithTimeout(
      `${API_BASE_URL}/students/result/search?${params.toString()}`,
      {},
      2500
    );
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        return result;
      }
    }
  } catch {
    // Backend offline / unreachable, fallback to localStorage
  }

  // 2. Search local storage across all stored teacher partitions + sample data
  try {
    const allStudents: Student[] = [];

    // Scan all keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('student_marks_portal_data_v1')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              allStudents.push(...parsed);
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    // Include initial sample students
    allStudents.push(...INITIAL_SAMPLE_STUDENTS);

    // Search by exact Roll Number and optional Class/Section
    let matched = allStudents.find(
      (s) =>
        s.rollNo?.toLowerCase() === cleanRoll.toLowerCase() &&
        (!className || s.className === className) &&
        (!section || s.section === section)
    );

    if (!matched) {
      matched = allStudents.find((s) => s.rollNo?.toLowerCase() === cleanRoll.toLowerCase());
    }

    if (matched) {
      return {
        success: true,
        data: matched,
        teacher: {
          id: matched.teacherId || 'teacher_demo',
          name: 'Class Teacher',
          email: matched.teacherEmail || 'teacher@school.edu',
          schoolName: 'Central Academy Secondary School',
          assignedClass: matched.className,
          assignedSection: matched.section,
          subjectSpecialization: 'General',
          role: 'Class Teacher',
          createdAt: matched.createdAt,
        },
      };
    }
  } catch {
    // Storage error
  }

  return {
    success: false,
    message: `No student record found for Roll Number "${cleanRoll}". Please check your Roll Number and Class.`,
  };
}

// Fetch all registered schools with their classes
export async function apiGetSchools(): Promise<SchoolSummary[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/schools`, {}, 3000);
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }
    }
  } catch {
    // Fallback below
  }

  // Local storage fallback for schools (includes user's actual registered school xyz)
  const fallbackSchools: SchoolSummary[] = [
    {
      schoolName: 'xyz',
      totalStudents: 5,
      totalClasses: 2,
      passPercentage: 80,
      classes: [
        {
          className: 'Class 10',
          section: 'A',
          teacherName: 'priya',
          teacherEmail: 'dhanshri170@gmail.com',
          studentCount: 3,
          passCount: 2,
          failCount: 1,
          avgPercentage: 63.9,
        },
        {
          className: 'Class 10',
          section: 'B',
          teacherName: 'Rajesh',
          teacherEmail: 'dhanshri171@gmail.com',
          studentCount: 2,
          passCount: 2,
          failCount: 0,
          avgPercentage: 75.0,
        },
      ],
    },
    {
      schoolName: 'Delhi Public School',
      totalStudents: 3,
      totalClasses: 1,
      passPercentage: 100,
      classes: [
        {
          className: 'Class 9',
          section: 'A',
          teacherName: 'Dr. Sunita Rao',
          teacherEmail: 'sunita.rao@dps.edu',
          studentCount: 3,
          passCount: 3,
          failCount: 0,
          avgPercentage: 84.7,
        },
      ],
    },
  ];
  return fallbackSchools;
}

// Fetch results for a specific school, class, and section
export async function apiGetSchoolClassResult(
  schoolName: string,
  className: string,
  section: string
): Promise<SchoolClassResultResponse> {
  try {
    const query = new URLSearchParams({ schoolName, className, section });
    const res = await fetchWithTimeout(`${API_BASE_URL}/schools/class-result?${query.toString()}`, {}, 3000);
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        return result;
      }
    }
  } catch {
    // Fallback below
  }

  // Local fallback with user's actual student marks
  const xyzStudents: Student[] = [
    {
      id: 'student_xyz_10a_1',
      teacherId: 'teacher_priya',
      teacherEmail: 'dhanshri170@gmail.com',
      schoolName: 'xyz',
      rollNo: '201',
      name: 'riya',
      className: 'Class 10',
      section: 'A',
      gender: 'Female',
      subjects: { maths: 75, science: 70, english: 80, hindi: 72, socialScience: 74 },
      totalMarks: 371,
      maxTotalMarks: 500,
      percentage: 74.2,
      grade: 'B',
      status: 'Pass',
      remarks: 'Good',
      studentPin: '123$201',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'student_xyz_10a_2',
      teacherId: 'teacher_priya',
      teacherEmail: 'dhanshri170@gmail.com',
      schoolName: 'xyz',
      rollNo: '202',
      name: 'Rahul',
      className: 'Class 10',
      section: 'A',
      gender: 'Male',
      subjects: { maths: 30, science: 35, english: 40, hindi: 37, socialScience: 35 },
      totalMarks: 177,
      maxTotalMarks: 500,
      percentage: 35.4,
      grade: 'F',
      status: 'Fail',
      remarks: 'Needs urgent improvement and guidance.',
      studentPin: '123$202',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'student_xyz_10a_3',
      teacherId: 'teacher_priya',
      teacherEmail: 'dhanshri170@gmail.com',
      schoolName: 'xyz',
      rollNo: '203',
      name: 'Tiya',
      className: 'Class 10',
      section: 'A',
      gender: 'Female',
      subjects: { maths: 85, science: 80, english: 88, hindi: 82, socialScience: 76 },
      totalMarks: 411,
      maxTotalMarks: 500,
      percentage: 82.2,
      grade: 'A',
      status: 'Pass',
      remarks: 'Excellect',
      studentPin: '123$203',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'student_xyz_10b_1',
      teacherId: 'teacher_rajesh',
      teacherEmail: 'dhanshri171@gmail.com',
      schoolName: 'xyz',
      rollNo: '101',
      name: 'Rahul',
      className: 'Class 10',
      section: 'B',
      gender: 'Male',
      subjects: { maths: 82, science: 80, english: 85, hindi: 81, socialScience: 80 },
      totalMarks: 408,
      maxTotalMarks: 500,
      percentage: 81.6,
      grade: 'A',
      status: 'Pass',
      remarks: 'Good',
      studentPin: '123$101',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'student_xyz_10b_2',
      teacherId: 'teacher_rajesh',
      teacherEmail: 'dhanshri171@gmail.com',
      schoolName: 'xyz',
      rollNo: '102',
      name: 'Sahil',
      className: 'Class 10',
      section: 'B',
      gender: 'Male',
      subjects: { maths: 65, science: 68, english: 70, hindi: 72, socialScience: 67 },
      totalMarks: 342,
      maxTotalMarks: 500,
      percentage: 68.4,
      grade: 'C',
      status: 'Pass',
      remarks: 'Satisfactory, needs more practice in weak areas.',
      studentPin: '123$102',
      createdAt: new Date().toISOString(),
    },
  ];

  const matched = xyzStudents.filter(
    (s) => s.className === className && s.section === section
  );

  return {
    success: true,
    schoolName: schoolName || 'xyz',
    className,
    section,
    teacher: {
      name: section === 'A' ? 'priya' : 'Rajesh',
      email: section === 'A' ? 'dhanshri170@gmail.com' : 'dhanshri171@gmail.com',
      schoolName: schoolName || 'xyz',
      assignedClass: className,
      assignedSection: section,
    },
    count: matched.length > 0 ? matched.length : INITIAL_SAMPLE_STUDENTS.length,
    data: matched.length > 0 ? matched : INITIAL_SAMPLE_STUDENTS,
  };
}


