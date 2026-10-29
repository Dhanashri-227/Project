import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { StudentTable } from './components/StudentTable';
import { StudentFormModal } from './components/StudentFormModal';
import { ReportCardModal } from './components/ReportCardModal';
import { TeacherAuth } from './components/TeacherAuth';
import { StudentResultPortal } from './components/StudentResultPortal';
import { SchoolPortal } from './components/SchoolPortal';
import { Student, StudentFormData } from './types/student';
import { Teacher } from './types/auth';
import { getCurrentTeacherSession, logoutTeacher } from './utils/auth';
import {
  apiGetStudents,
  apiCreateStudent,
  apiUpdateStudent,
  apiDeleteStudent,
  checkBackendHealth,
} from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students'>('dashboard');
  const [viewMode, setViewMode] = useState<'teacher' | 'student_portal' | 'school_portal'>('teacher');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingReportStudent, setViewingReportStudent] = useState<Student | null>(null);
  const [viewingReportTeacher, setViewingReportTeacher] = useState<Teacher | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Check existing session on mount
  useEffect(() => {
    const session = getCurrentTeacherSession();
    if (session) {
      setCurrentTeacher(session);
    }
  }, []);

  // Fetch only this classroom teacher's students whenever currentTeacher changes
  useEffect(() => {
    if (!currentTeacher) {
      setStudents([]);
      return;
    }

    const fetchTeacherStudents = async () => {
      setIsLoading(true);
      await checkBackendHealth();

      try {
        const studentList = await apiGetStudents(currentTeacher);
        setStudents(studentList);
      } catch (err) {
        console.error('Failed to load teacher students:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherStudents();
  }, [currentTeacher]);

  // Handler: Logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of your Classroom Teacher Portal?')) {
      logoutTeacher();
      setCurrentTeacher(null);
      setStudents([]);
      showToast('You have been logged out safely.', 'info');
    }
  };

  // Handler: Save or Update Student Marks in MongoDB
  const handleSaveStudent = async (formData: StudentFormData, editId?: string): Promise<void> => {
    if (!currentTeacher) return;

    try {
      if (editId) {
        // Update existing student
        const updated = await apiUpdateStudent(editId, formData, currentTeacher.id);
        setStudents((prev) => prev.map((s) => (s.id === editId ? updated : s)));
        showToast(`Student #${formData.rollNo} (${formData.name}) updated successfully!`);
      } else {
        // Add new student under current classroom teacher
        const created = await apiCreateStudent(formData, currentTeacher);
        setStudents((prev) => [created, ...prev]);
        showToast(`Student #${formData.rollNo} (${formData.name}) saved for ${currentTeacher.assignedClass}-${currentTeacher.assignedSection}!`);
      }
      setEditingStudent(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save student record to database.';
      showToast(message, 'error');
      throw error;
    }
  };

  // Handler: Delete Student from MongoDB
  const handleDeleteStudent = async (id: string) => {
    if (!currentTeacher) return;

    const target = students.find((s) => s.id === id);
    const confirmMsg = target
      ? `Are you sure you want to delete the record for "${target.name}" (Roll #${target.rollNo}) from ${currentTeacher.assignedClass}-${currentTeacher.assignedSection}?`
      : 'Are you sure you want to delete this record?';

    if (window.confirm(confirmMsg)) {
      try {
        await apiDeleteStudent(id, currentTeacher.id);
        setStudents((prev) => prev.filter((s) => s.id !== id));
        showToast('Student record deleted.', 'info');
      } catch {
        showToast('Failed to delete student.', 'error');
      }
    }
  };



  // If in Student Result Portal mode, show the Student Section directly
  if (viewMode === 'student_portal') {
    return (
      <>
        <StudentResultPortal
          onBackToTeacherPortal={() => setViewMode('teacher')}
          onGoToSchoolPortal={() => setViewMode('school_portal')}
          onViewFullReportCard={(student, teacher) => {
            setViewingReportStudent(student);
            setViewingReportTeacher(teacher || currentTeacher);
          }}
          isLoggedInTeacher={Boolean(currentTeacher)}
        />
        {/* Printable Report Card Marksheet Modal */}
        <ReportCardModal
          student={viewingReportStudent}
          teacher={viewingReportTeacher || currentTeacher}
          onClose={() => {
            setViewingReportStudent(null);
            setViewingReportTeacher(null);
          }}
        />
      </>
    );
  }

  // If in School Results Portal mode, show the School & Class Section directly
  if (viewMode === 'school_portal') {
    return (
      <>
        <SchoolPortal
          onGoToTeacherPortal={() => setViewMode('teacher')}
          onGoToStudentPortal={() => setViewMode('student_portal')}
          onViewReportCard={(student, teacher) => {
            setViewingReportStudent(student);
            setViewingReportTeacher(teacher || currentTeacher);
          }}
          isLoggedInTeacher={Boolean(currentTeacher)}
        />
        {/* Printable Report Card Marksheet Modal */}
        <ReportCardModal
          student={viewingReportStudent}
          teacher={viewingReportTeacher || currentTeacher}
          onClose={() => {
            setViewingReportStudent(null);
            setViewingReportTeacher(null);
          }}
        />
      </>
    );
  }

  // If teacher is not logged in, display the Teacher Auth Screen with options to visit Student or School Section
  if (!currentTeacher) {
    return (
      <TeacherAuth
        onLoginSuccess={(teacher) => {
          setCurrentTeacher(teacher);
          showToast(`Welcome, Class Teacher of ${teacher.assignedClass}-${teacher.assignedSection}!`);
        }}
        onGoToStudentPortal={() => setViewMode('student_portal')}
        onGoToSchoolPortal={() => setViewMode('school_portal')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 text-xs font-semibold">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : toast.type === 'info' ? (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingStudent(null);
          setIsFormModalOpen(true);
        }}
        studentCount={students.length}
        currentTeacher={currentTeacher}
        onLogout={handleLogout}
        onGoToStudentPortal={() => setViewMode('student_portal')}
        onGoToSchoolPortal={() => setViewMode('school_portal')}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Loading your classroom student records...</p>
          </div>
        ) : activeTab === 'dashboard' ? (
          <Dashboard
            students={students}
            teacher={currentTeacher}
            onOpenAddModal={() => {
              setEditingStudent(null);
              setIsFormModalOpen(true);
            }}
            onNavigateToStudents={() => setActiveTab('students')}
            onViewReportCard={(student) => {
              setViewingReportStudent(student);
              setViewingReportTeacher(currentTeacher);
            }}
          />
        ) : (
          <StudentTable
            students={students}
            onOpenAddModal={() => {
              setEditingStudent(null);
              setIsFormModalOpen(true);
            }}
            onEditStudent={(student) => {
              setEditingStudent(student);
              setIsFormModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onViewReportCard={(student) => {
              setViewingReportStudent(student);
              setViewingReportTeacher(currentTeacher);
            }}
          />
        )}
      </main>

      {/* Add / Edit Marks Modal */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        teacher={currentTeacher}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
        editStudent={editingStudent}
      />

      {/* Printable Report Card Marksheet Modal */}
      <ReportCardModal
        student={viewingReportStudent}
        teacher={viewingReportTeacher || currentTeacher}
        onClose={() => {
          setViewingReportStudent(null);
          setViewingReportTeacher(null);
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-5 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-medium">
            EduGrade Portal • Classroom Teacher Marks Management System
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Logged in as {currentTeacher.name} ({currentTeacher.email}) • Class Teacher: {currentTeacher.assignedClass} - Section {currentTeacher.assignedSection}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
