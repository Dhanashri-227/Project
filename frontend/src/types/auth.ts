export interface Teacher {
  id: string;
  name: string;
  email: string;
  password?: string;
  schoolName: string;
  assignedClass: string;
  assignedSection: string;
  subjectSpecialization: string;
  role: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: Teacher | null;
}
