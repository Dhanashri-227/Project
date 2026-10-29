import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserPlus,
  Sparkles,
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
    <header className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Portal Branding */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
                  EduGrade Portal
                </span>
                {currentTeacher && (
                  <span className="hidden sm:inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs">
                    <Layers className="w-3 h-3 mr-1" />
                    {currentTeacher.assignedClass} - Section {currentTeacher.assignedSection}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200 font-medium truncate max-w-[200px] sm:max-w-none">
                {currentTeacher?.schoolName || 'Classroom Teacher Portal'}
              </p>
            </div>
          </div>

          {/* Navigation Items & Teacher Profile */}
          <nav className="flex items-center space-x-1.5 sm:space-x-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white/20 text-white shadow-sm border border-white/20'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'students'
                  ? 'bg-white/20 text-white shadow-sm border border-white/20'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Students</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-indigo-500/50 text-indigo-100 font-bold">
                {studentCount}
              </span>
            </button>

            {/* Student Result Section Button */}
            {onGoToStudentPortal && (
              <button
                onClick={onGoToStudentPortal}
                title="Open Student Login Portal"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40 transition-all hover:scale-105"
              >
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span className="hidden lg:inline">Student Login</span>
                <span className="lg:hidden">Student</span>
              </button>
            )}

            {/* School Results Section Button */}
            {onGoToSchoolPortal && (
              <button
                onClick={onGoToSchoolPortal}
                title="Browse Results by School & Class"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-emerald-400/20 text-emerald-300 hover:bg-emerald-400/30 border border-emerald-400/40 transition-all hover:scale-105"
              >
                <School className="w-4 h-4 text-emerald-300" />
                <span className="hidden lg:inline">School Results</span>
                <span className="lg:hidden">Schools</span>
              </button>
            )}

            {/* Add Marks Action */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.99]"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Marks</span>
              <span className="sm:hidden">+</span>
            </button>

            {/* Teacher Profile & Logout */}
            {currentTeacher && (
              <div className="flex items-center pl-2 border-l border-white/15 space-x-2">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-bold text-white leading-tight">
                    {currentTeacher.name}
                  </p>
                  <p className="text-[10px] text-amber-300 font-semibold">
                    Class Teacher ({currentTeacher.assignedClass}-{currentTeacher.assignedSection})
                  </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 border border-indigo-300/50 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                  {currentTeacher.name.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition-colors"
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
