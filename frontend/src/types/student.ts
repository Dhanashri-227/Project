export interface SubjectMark {
  subject: string;
  marks: number;
  maxMarks: number;
}

export interface Student {
  id: string;
  teacherId: string;
  teacherEmail?: string;
  schoolName?: string;
  rollNo: string;
  name: string;
  className: string;
  section: string;
  gender?: 'Male' | 'Female' | 'Other';
  subjects: {
    maths: number;
    science: number;
    english: number;
    hindi: number;
    socialScience: number;
  };
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  status: 'Pass' | 'Fail';
  remarks?: string;
  studentPin?: string;
  createdAt: string;
}

export interface StudentFormData {
  rollNo: string;
  name: string;
  className: string;
  section: string;
  schoolName?: string;
  gender: 'Male' | 'Female' | 'Other';
  maths: number | string;
  science: number | string;
  english: number | string;
  hindi: number | string;
  socialScience: number | string;
  remarks?: string;
  studentPin?: string;
}

export interface DashboardStats {
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passPercentage: number;
  classAverage: number;
  highestPercentage: number;
  topPerformer: Student | null;
}

export interface SchoolClassInfo {
  className: string;
  section: string;
  teacherId?: string;
  teacherName?: string;
  teacherEmail?: string;
  studentCount: number;
  passCount: number;
  failCount: number;
  avgPercentage: number;
}

export interface SchoolSummary {
  schoolName: string;
  totalStudents: number;
  totalClasses: number;
  passPercentage: number;
  classes: SchoolClassInfo[];
}

export interface SchoolClassResultResponse {
  success: boolean;
  schoolName: string;
  className: string;
  section: string;
  teacher?: {
    id?: string;
    name?: string;
    email?: string;
    schoolName?: string;
    assignedClass?: string;
    assignedSection?: string;
  } | null;
  count: number;
  data: Student[];
  message?: string;
}
