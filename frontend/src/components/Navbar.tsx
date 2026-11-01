import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserPlus,
  LogOut,
  Layers,
  School,
} from 'lucide-react';
import { Teacher } from '../types/auth';

interface NavbarProps {
  activeTab: 'dashboard' | 'students';
  setActiveTab: (tab: 'dashboard' | 'students') => void;
  onOpenAddModal: () => void;
  studentCount: number;
  currentTeacher: Teacher | null;
  onLogout: () => void;
  onGoToStudentPortal?: () => void;
  onGoToSchoolPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  studentCount,
  currentTeacher,
  onLogout,
  onGoToStudentPortal,
  onGoToSchoolPortal,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Portal Branding */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  EduGrade Portal
                </span>
                {currentTeacher && (
                  <span className="hidden sm:inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    <Layers className="w-3 h-3 mr-1" />
                    {currentTeacher.assignedClass} - Section {currentTeacher.assignedSection}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-none">
                {currentTeacher?.schoolName || 'Classroom Teacher Portal'}
              </p>
            </div>
          </div>

          {/* Navigation Items & Actions */}
          <nav className="flex items-center space-x-1.5 sm:space-x-2.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'students'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Students</span>
              <span className="ml-1 px-1.5 py-0.2 text-[11px] rounded-full bg-slate-800 text-indigo-300 font-bold border border-slate-700">
                {studentCount}
              </span>
            </button>

            {/* Student Result Portal Button */}
            {onGoToStudentPortal && (
              <button
                onClick={onGoToStudentPortal}
                title="Open Student Portal"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline">Student Portal</span>
                <span className="lg:hidden">Student</span>
              </button>
            )}

            {/* School Results Portal Button */}
            {onGoToSchoolPortal && (
              <button
                onClick={onGoToSchoolPortal}
                title="Browse Results by School & Class"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors"
              >
                <School className="w-4 h-4 text-emerald-400" />
                <span className="hidden lg:inline">School Results</span>
                <span className="lg:hidden">Schools</span>
              </button>
            )}

            {/* Add Marks Action */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all active:scale-[0.99]"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Marks</span>
              <span className="sm:hidden">+</span>
            </button>

            {/* Teacher Profile & Logout */}
            {currentTeacher && (
              <div className="flex items-center pl-2 border-l border-slate-800 space-x-2">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-bold text-white leading-tight">
                    {currentTeacher.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {currentTeacher.assignedClass}-{currentTeacher.assignedSection}
                  </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
                  {currentTeacher.name.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
