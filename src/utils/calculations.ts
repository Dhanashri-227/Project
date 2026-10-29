import { Student, DashboardStats } from '../types/student';

export const SUBJECT_NAMES = {
  maths: 'Mathematics',
  science: 'Science',
  english: 'English',
  hindi: 'Hindi',
  socialScience: 'Social Science',
} as const;

export const PASSING_MARKS_PER_SUBJECT = 33;
export const MAX_MARKS_PER_SUBJECT = 100;
export const TOTAL_SUBJECTS = 5;
export const MAX_TOTAL_MARKS = TOTAL_SUBJECTS * MAX_MARKS_PER_SUBJECT;

export function calculateStudentMetrics(subjects: {
  maths: number;
  science: number;
  english: number;
  hindi: number;
  socialScience: number;
}) {
  const values = Object.values(subjects);
  const totalMarks = values.reduce((sum, val) => sum + (Number(val) || 0), 0);
  const percentage = Number(((totalMarks / MAX_TOTAL_MARKS) * 100).toFixed(2));

  // A student fails if any subject is below passing marks (33)
  const hasFailedAnySubject = values.some(
    (mark) => (Number(mark) || 0) < PASSING_MARKS_PER_SUBJECT
  );

  let grade = 'F';
  let status: 'Pass' | 'Fail' = 'Pass';

  if (hasFailedAnySubject || percentage < 33) {
    status = 'Fail';
    grade = 'F';
  } else if (percentage >= 90) {
    grade = 'A+';
  } else if (percentage >= 80) {
    grade = 'A';
  } else if (percentage >= 70) {
    grade = 'B';
  } else if (percentage >= 60) {
    grade = 'C';
  } else if (percentage >= 40) {
    grade = 'D';
  } else {
    grade = 'E';
  }

  let autoRemarks = 'Good effort!';
  if (percentage >= 90) autoRemarks = 'Outstanding Performance! Keep it up!';
  else if (percentage >= 80) autoRemarks = 'Excellent work, very consistent!';
  else if (percentage >= 70) autoRemarks = 'Very Good, can achieve higher with focused revision.';
  else if (percentage >= 50) autoRemarks = 'Satisfactory, needs more practice in weak areas.';
  else if (status === 'Fail') autoRemarks = 'Needs urgent improvement and guidance.';

  return {
    totalMarks,
    maxTotalMarks: MAX_TOTAL_MARKS,
    percentage,
    grade,
    status,
    autoRemarks,
  };
}

export function computeDashboardStats(students: Student[]): DashboardStats {
  if (students.length === 0) {
    return {
      totalStudents: 0,
      passedStudents: 0,
      failedStudents: 0,
      passPercentage: 0,
      classAverage: 0,
      highestPercentage: 0,
      topPerformer: null,
    };
  }

  const totalStudents = students.length;
  const passedStudents = students.filter((s) => s.status === 'Pass').length;
  const failedStudents = totalStudents - passedStudents;
  const passPercentage = Number(((passedStudents / totalStudents) * 100).toFixed(1));

  const totalPercentageSum = students.reduce((acc, s) => acc + s.percentage, 0);
  const classAverage = Number((totalPercentageSum / totalStudents).toFixed(1));

  const sortedByScore = [...students].sort((a, b) => b.percentage - a.percentage);
  const topPerformer = sortedByScore[0] || null;
  const highestPercentage = topPerformer ? topPerformer.percentage : 0;

  return {
    totalStudents,
    passedStudents,
    failedStudents,
    passPercentage,
    classAverage,
    highestPercentage,
    topPerformer,
  };
}

export function getGradeBadgeColor(grade: string): string {
  switch (grade) {
    case 'A+':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'A':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'B':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'C':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'D':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-rose-100 text-rose-800 border-rose-300';
  }
}
