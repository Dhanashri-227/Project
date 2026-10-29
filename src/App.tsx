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

  // Handler: Load Sample Student Data
  const handleLoadSampleData = async () => {
    if (!currentTeacher) return;
    try {
      const sampleList: Student[] = [
        {
          id: `sample_${Date.now()}_1`,
          teacherId: currentTeacher.id,
          teacherEmail: currentTeacher.email,
          rollNo: '101',
          name: 'Aarav Sharma',
          className: currentTeacher.assignedClass,
          section: currentTeacher.assignedSection,
          gender: 'Male',
          subjects: { maths: 92, science: 95, english: 88, hindi: 84, socialScience: 91 },
          totalMarks: 450,
          maxTotalMarks: 500,
          percentage: 90,
          grade: 'A+',
          status: 'Pass',
          remarks: 'Outstanding performance! Consistently top of the class.',
          createdAt: new Date().toISOString(),
        },
        {
          id: `sample_${Date.now()}_2`,
          teacherId: currentTeacher.id,
          teacherEmail: currentTeacher.email,
          rollNo: '102',
          name: 'Priya Patel',
          className: currentTeacher.assignedClass,
          section: currentTeacher.assignedSection,
          gender: 'Female',
          subjects: { maths: 85, science: 89, english: 92, hindi: 90, socialScience: 84 },
          totalMarks: 440,
          maxTotalMarks: 500,
          percentage: 88,
          grade: 'A',
          status: 'Pass',
          remarks: 'Excellent comprehension and disciplined coursework.',
          createdAt: new Date().toISOString(),
        },
        {
          id: `sample_${Date.now()}_3`,
          teacherId: currentTeacher.id,
          teacherEmail: currentTeacher.email,
          rollNo: '103',
          name: 'Rohan Verma',
          className: currentTeacher.assignedClass,
          section: currentTeacher.assignedSection,
          gender: 'Male',
          subjects: { maths: 74, science: 68, english: 72, hindi: 78, socialScience: 70 },
          totalMarks: 362,
          maxTotalMarks: 500,
          percentage: 72.4,
          grade: 'B',
          status: 'Pass',
          remarks: 'Good progress. Needs to focus a bit more on Science concepts.',
          createdAt: new Date().toISOString(),
        },
        {
          id: `sample_${Date.now()}_4`,
          teacherId: currentTeacher.id,
          teacherEmail: currentTeacher.email,
          rollNo: '104',
          name: 'Ananya Gupta',
          className: currentTeacher.assignedClass,
          section: currentTeacher.assignedSection,
          gender: 'Female',
          subjects: { maths: 62, science: 58, english: 65, hindi: 70, socialScience: 60 },
          totalMarks: 315,
          maxTotalMarks: 500,
          percentage: 63,
          grade: 'C',
          status: 'Pass',
          remarks: 'Satisfactory. Regular practice in Maths will improve scores.',
          createdAt: new Date().toISOString(),
        },
        {
          id: `sample_${Date.now()}_5`,
          teacherId: currentTeacher.id,
          teacherEmail: currentTeacher.email,
          rollNo: '105',
          name: 'Vikram Singh',
          className: currentTeacher.assignedClass,
          section: currentTeacher.assignedSection,
          gender: 'Male',
          subjects: { maths: 28, science: 45, english: 52, hindi: 50, socialScience: 48 },
          totalMarks: 223,
          maxTotalMarks: 500,
          percentage: 44.6,
          grade: 'F',
          status: 'Fail',
          remarks: 'Failed in Mathematics (<33). Needs remedial coaching and re-test.',
          createdAt: new Date().toISOString(),
        },
      ];

      for (const item of sampleList) {
        await apiCreateStudent(
          {
            rollNo: item.rollNo,
            name: item.name,
            className: item.className,
            section: item.section,
            gender: item.gender || 'Male',
            maths: item.subjects.maths,
            science: item.subjects.science,
            english: item.subjects.english,
            hindi: item.subjects.hindi,
            socialScience: item.subjects.socialScience,
            remarks: item.remarks,
          },
          currentTeacher
        );
      }

      setStudents(sampleList);
      showToast('Sample student records loaded successfully!');
    } catch {
      showToast('Failed to load sample data.', 'error');
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
            onLoadSampleData={handleLoadSampleData}
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
