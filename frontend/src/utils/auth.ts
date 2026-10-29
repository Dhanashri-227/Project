import { Teacher } from '../types/auth';

const TEACHERS_STORAGE_KEY = 'edugrade_registered_teachers_v1';
const CURRENT_USER_STORAGE_KEY = 'edugrade_current_teacher_session_v1';

export function getRegisteredTeachers(): Teacher[] {
  try {
    const raw = localStorage.getItem(TEACHERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to load registered teachers:', err);
    return [];
  }
}

export function getCurrentTeacherSession(): Teacher | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to retrieve current teacher session:', err);
    return null;
  }
}

export function saveCurrentTeacherSession(teacher: Teacher | null): void {
  try {
    if (teacher) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(teacher));
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to update teacher session:', err);
  }
}

export function registerTeacher(data: {
  name: string;
  email: string;
  password: string;
  schoolName: string;
  assignedClass: string;
  assignedSection: string;
  subjectSpecialization: string;
}): { success: boolean; message: string; teacher?: Teacher } {
  const teachers = getRegisteredTeachers();
  const normalizedEmail = data.email.trim().toLowerCase();
  const targetClass = data.assignedClass || 'Class 10';
  const targetSection = data.assignedSection || 'A';

  // 1. Check duplicate email
  if (teachers.some((t) => t.email.toLowerCase() === normalizedEmail)) {
    return {
      success: false,
      message: 'An account with this email address already exists. Please sign in.',
    };
  }

  // 2. Enforce 1 Teacher per Class and Section
  const existingClassTeacher = teachers.find(
    (t) => t.assignedClass === targetClass && t.assignedSection === targetSection
  );

  if (existingClassTeacher) {
    return {
      success: false,
      message: `Class Teacher for ${targetClass} - Section ${targetSection} is already registered (${existingClassTeacher.name}). Only 1 teacher can be assigned per class.`,
    };
  }

  const newTeacher: Teacher = {
    id: `teacher_${Date.now()}`,
    name: data.name.trim(),
    email: normalizedEmail,
    password: data.password,
    schoolName: data.schoolName.trim() || 'Academic Institution',
    assignedClass: targetClass,
    assignedSection: targetSection,
    subjectSpecialization: data.subjectSpecialization.trim() || 'Class Teacher',
    role: 'Class Teacher',
    createdAt: new Date().toISOString(),
  };

  const updatedList = [...teachers, newTeacher];
  localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updatedList));
  saveCurrentTeacherSession(newTeacher);

  return {
    success: true,
    message: 'Account created successfully! Welcome aboard.',
    teacher: newTeacher,
  };
}

export function loginTeacher(
  email: string,
  password: string
): { success: boolean; message: string; teacher?: Teacher } {
  const teachers = getRegisteredTeachers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = teachers.find(
    (t) => t.email.toLowerCase() === normalizedEmail && t.password === password
  );

  if (!user) {
    return {
      success: false,
      message: 'Invalid email or password. Please check your credentials or create an account.',
    };
  }

  saveCurrentTeacherSession(user);
  return {
    success: true,
    message: `Welcome back, ${user.name}!`,
    teacher: user,
  };
}

export function logoutTeacher(): void {
  saveCurrentTeacherSession(null);
}
