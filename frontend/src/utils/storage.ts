import { Student } from '../types/student';

const BASE_STORAGE_KEY = 'student_marks_portal_data_v1';

export const INITIAL_SAMPLE_STUDENTS: Student[] = [];

export function getTeacherStorageKey(teacherId?: string): string {
  if (!teacherId) return BASE_STORAGE_KEY;
  return `${BASE_STORAGE_KEY}_teacher_${teacherId}`;
}

export function getStoredStudents(teacherId?: string): Student[] {
  try {
    const key = getTeacherStorageKey(teacherId);
    const raw = localStorage.getItem(key);
    if (!raw) {
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
