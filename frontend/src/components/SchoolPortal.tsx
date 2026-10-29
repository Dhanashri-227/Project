import React, { useState, useEffect, useMemo } from 'react';
import {
  School,
  GraduationCap,
  Users,
  Search,
  ArrowLeft,
  ChevronRight,
  Trophy,
  CheckCircle2,
  XCircle,
  Percent,
  Printer,
  Sparkles,
  BookOpen,
  ArrowRight,
  Eye,
  LogIn,
  Layers,
  Award,
  Filter,
} from 'lucide-react';
import { SchoolSummary, SchoolClassInfo, Student } from '../types/student';
import { Teacher } from '../types/auth';
import { apiGetSchools, apiGetSchoolClassResult } from '../services/api';

interface SchoolPortalProps {
  onGoToTeacherPortal: () => void;
  onGoToStudentPortal: () => void;
  onViewReportCard: (student: Student, teacher?: Teacher | null) => void;
  isLoggedInTeacher?: boolean;
}

export const SchoolPortal: React.FC<SchoolPortalProps> = ({
  onGoToTeacherPortal,
  onGoToStudentPortal,
  onViewReportCard,
  isLoggedInTeacher = false,
}) => {
  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation states within School Portal
  const [selectedSchool, setSelectedSchool] = useState<SchoolSummary | null>(null);
  const [selectedClass, setSelectedClass] = useState<SchoolClassInfo | null>(null);

  // Class result state
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [classTeacher, setClassTeacher] = useState<Teacher | null>(null);
  const [isClassLoading, setIsClassLoading] = useState<boolean>(false);

  // Filters & Search
  const [schoolSearch, setSchoolSearch] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'rollNo' | 'name' | 'percentage'>('rank');

  // Load all schools on mount
  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetSchools();
      setSchools(data);
    } catch {
      setError('Failed to load schools. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // When a class is clicked, fetch its detailed student results
  const handleSelectClass = async (school: SchoolSummary, cls: SchoolClassInfo) => {
    setSelectedSchool(school);
    setSelectedClass(cls);
    setIsClassLoading(true);
    try {
      const res = await apiGetSchoolClassResult(school.schoolName, cls.className, cls.section);
      if (res.success && res.data) {
        setClassStudents(res.data);
        if (res.teacher) {
          setClassTeacher({
            id: res.teacher.id || 'teacher_demo',
            name: res.teacher.name || 'Class Teacher',
            email: res.teacher.email || 'teacher@school.edu',
            schoolName: res.teacher.schoolName || school.schoolName,
            assignedClass: res.teacher.assignedClass || cls.className,
            assignedSection: res.teacher.assignedSection || cls.section,
            subjectSpecialization: 'Class Teacher',
            role: 'Class Teacher',
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsClassLoading(false);
    }
  };

  // Filtered schools
  const filteredSchools = useMemo(() => {
    if (!schoolSearch.trim()) return schools;
    const q = schoolSearch.toLowerCase();
    return schools.filter(
      (s) =>
        s.schoolName.toLowerCase().includes(q) ||
        s.classes.some((c) => `${c.className} ${c.section}`.toLowerCase().includes(q))
    );
  }, [schools, schoolSearch]);

  // Filtered and sorted class students
  const filteredStudents = useMemo(() => {
    let list = [...classStudents];

    // Status filter
    if (statusFilter === 'pass') {
      list = list.filter((s) => s.status === 'Pass');
    } else if (statusFilter === 'fail') {
      list = list.filter((s) => s.status === 'Fail');
    }

    // Search query
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'percentage' || sortBy === 'rank') {
        return b.percentage - a.percentage;
      }
      if (sortBy === 'rollNo') {
        const rA = parseInt(a.rollNo, 10);
        const rB = parseInt(b.rollNo, 10);
        if (!isNaN(rA) && !isNaN(rB)) return rA - rB;
        return a.rollNo.localeCompare(b.rollNo);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [classStudents, statusFilter, studentSearch, sortBy]);

  // Class statistics
  const classStats = useMemo(() => {
    if (classStudents.length === 0) {
      return { total: 0, passed: 0, failed: 0, passPct: 0, avgPct: 0, top: null };
    }
    const total = classStudents.length;
    const passed = classStudents.filter((s) => s.status === 'Pass').length;
    const failed = total - passed;
    const passPct = Number(((passed / total) * 100).toFixed(1));
    const totalPct = classStudents.reduce((acc, s) => acc + s.percentage, 0);
    const avgPct = Number((totalPct / total).toFixed(1));
    const sorted = [...classStudents].sort((a, b) => b.percentage - a.percentage);
    const top = sorted[0] || null;

    return { total, passed, failed, passPct, avgPct, top };
  }, [classStudents]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-950 text-white shadow-xl sticky top-0 z-30 border-b border-emerald-700/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => {
                setSelectedClass(null);
                setSelectedSchool(null);
              }}
            >
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                <School className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
                    EduGrade Portal
                  </span>
                  <span className="hidden sm:inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                    School & Class Results
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 font-medium">
                  Centralized Multi-School Examination Repository
                </p>
              </div>
            </div>

            {/* Portal Switchers */}
            <nav className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={onGoToStudentPortal}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all hover:scale-105"
                title="Open Student Result Login"
              >
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span className="hidden md:inline">Student Login Portal</span>
                <span className="md:hidden">Student</span>
              </button>

              <button
                onClick={onGoToTeacherPortal}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40 border border-indigo-400/40 transition-all hover:scale-105"
                title="Teacher Marks Entry Portal"
              >
                <LogIn className="w-4 h-4 text-indigo-200" />
                <span className="hidden sm:inline">
                  {isLoggedInTeacher ? 'Teacher Dashboard' : 'Teacher Portal'}
                </span>
                <span className="sm:hidden">Teacher</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb Navigation Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedSchool(null);
                setSelectedClass(null);
              }}
              className={`hover:text-emerald-700 transition-colors flex items-center space-x-1 ${
                !selectedSchool ? 'text-emerald-700 font-bold' : ''
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>All Schools</span>
            </button>

            {selectedSchool && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  onClick={() => setSelectedClass(null)}
                  className={`hover:text-emerald-700 transition-colors ${
                    !selectedClass ? 'text-emerald-700 font-bold' : ''
                  }`}
                >
                  {selectedSchool.schoolName}
                </button>
              </>
            )}

            {selectedClass && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-emerald-700 font-bold">
                  {selectedClass.className} - Section {selectedClass.section}
                </span>
              </>
            )}
          </div>

          {(selectedSchool || selectedClass) && (
            <button
              onClick={() => {
                if (selectedClass) setSelectedClass(null);
                else setSelectedSchool(null);
              }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{selectedClass ? 'Back to Classes' : 'Back to Schools'}</span>
            </button>
          )}
        </div>

        {/* VIEW 1: ALL SCHOOLS DIRECTORY */}
        {!selectedSchool && !selectedClass && (
          <div className="space-y-6">
            {/* Banner Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
              <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3 h-3 mr-1.5 text-amber-300" />
                  School-Level Results Portal
                </span>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
                  Browse Examination Results by School
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  Select your school to explore class-wise examination marksheets, performance metrics,
                  and student report cards.
                </p>
              </div>

              {/* Quick Search Bar */}
              <div className="mt-6 relative max-w-md">
                <Search className="w-4 h-4 text-emerald-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search school name (e.g. xyz)..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-emerald-400/30 rounded-xl text-xs sm:text-sm text-white placeholder-emerald-200/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-slate-950/80 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold">Loading registered schools...</p>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center text-rose-700">
                <p className="font-bold text-sm mb-2">{error}</p>
                <button
                  onClick={loadSchools}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Schools Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {schoolSearch
                    ? `No schools match the search query "${schoolSearch}".`
                    : 'No schools are currently registered in the database.'}
                </p>
              </div>
            ) : (
              /* Schools Grid */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mr-2" />
                    Registered Institutions ({filteredSchools.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSchools.map((school) => (
                    <div
                      key={school.schoolName}
                      onClick={() => setSelectedSchool(school)}
                      className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-transparent rounded-bl-full opacity-60 group-hover:scale-110 transition-transform" />

                      <div>
                        {/* School Badge & Icon */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                            <School className="w-6 h-6" />
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {school.classes.length} {school.classes.length === 1 ? 'Class' : 'Classes'}
                          </span>
                        </div>

                        {/* School Name */}
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {school.schoolName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Academic Examination Portal
                        </p>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Enrolled Students
                            </span>
                            <span className="text-base font-black text-slate-900">
                              {school.totalStudents}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Pass Percentage
                            </span>
                            <span
                              className={`text-base font-black ${
                                school.passPercentage >= 75
                                  ? 'text-emerald-600'
                                  : school.passPercentage >= 50
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {school.passPercentage}%
                            </span>
                          </div>
                        </div>

                        {/* Classes Quick Chips */}
                        <div className="mt-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Available Classrooms:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {school.classes.slice(0, 3).map((c) => (
                              <span
                                key={`${c.className}-${c.section}`}
                                className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200"
                              >
                                {c.className}-{c.section} ({c.studentCount})
                              </span>
                            ))}
                            {school.classes.length > 3 && (
                              <span className="text-[11px] font-semibold text-slate-400 px-1 py-0.5">
                                +{school.classes.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                        <span>View Class Results</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: CLASS SELECTION FOR CHOSEN SCHOOL ("class wise") */}
        {selectedSchool && !selectedClass && (
          <div className="space-y-6">
            {/* School Hero Card */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <School className="w-4 h-4" />
                  <span>School Examination Center</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {selectedSchool.schoolName}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
                  Select a class below to open its comprehensive marksheet results and student rankings.
                </p>
              </div>

              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shrink-0">
                <div className="text-center px-3 border-r border-white/20">
                  <p className="text-[10px] uppercase font-bold text-emerald-200">Total Students</p>
                  <p className="text-xl font-black text-white">{selectedSchool.totalStudents}</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-[10px] uppercase font-bold text-emerald-200">Classes</p>
                  <p className="text-xl font-black text-amber-300">{selectedSchool.classes.length}</p>
                </div>
              </div>
            </div>

            {/* Class Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-emerald-600" />
                  Select a Class / Section ({selectedSchool.classes.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {selectedSchool.classes.map((cls) => (
                  <div
                    key={`${cls.className}-${cls.section}`}
                    onClick={() => handleSelectClass(selectedSchool, cls)}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Class Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black px-3 py-1 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center space-x-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-600 mr-1" />
                          <span>
                            {cls.className} - Section {cls.section}
                          </span>
                        </span>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            cls.avgPercentage >= 75
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          Avg: {cls.avgPercentage}%
                        </span>
                      </div>

                      {/* Teacher Details */}
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Class Teacher: {cls.teacherName || 'Assigned Teacher'}
                      </h3>
                      {cls.teacherEmail && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{cls.teacherEmail}</p>
                      )}

                      {/* Class Metrics */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                        <div className="p-2 rounded-xl bg-slate-50">
                          <span className="text-[10px] font-bold text-slate-400 block">STUDENTS</span>
                          <span className="text-sm font-black text-slate-800">{cls.studentCount}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50">
                          <span className="text-[10px] font-bold text-emerald-600 block">PASSED</span>
                          <span className="text-sm font-black text-emerald-700">{cls.passCount}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-rose-50">
                          <span className="text-[10px] font-bold text-rose-600 block">FAILED</span>
                          <span className="text-sm font-black text-rose-700">{cls.failCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                      <span>Open Full Class Results</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: FULL CLASS RESULTS MARKSHEET ("ush class ka result khul jana chahiye") */}
        {selectedSchool && selectedClass && (
          <div className="space-y-6">
            {/* Class Result Header Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-xs font-extrabold uppercase">
                      {selectedSchool.schoolName}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-extrabold uppercase">
                      {selectedClass.className} • Section {selectedClass.section}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    Classroom Examination Marksheet & Results
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                    Class Teacher:{' '}
                    <span className="font-bold text-white">
                      {classTeacher?.name || selectedClass.teacherName || 'Class Teacher'}
                    </span>{' '}
                    • Academic Session 2026-2027
                  </p>
                </div>

                {/* Print & Action Buttons */}
                <div className="flex items-center space-x-3 shrink-0 print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 shadow-md transition-all hover:scale-105"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>Print Class Marksheet</span>
                  </button>

                  <button
                    onClick={() => setSelectedClass(null)}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Switch Class</span>
                  </button>
                </div>
              </div>

              {/* Class KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-indigo-800/40">
                <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Total Students</span>
                  </div>
                  <p className="text-xl font-black text-white">{classStats.total}</p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Passed Students</span>
                  </div>
                  <p className="text-xl font-black text-emerald-300">
                    {classStats.passed}{' '}
                    <span className="text-xs font-normal text-emerald-200">
                      ({classStats.passPct}%)
                    </span>
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center space-x-2 text-rose-300 text-xs font-semibold mb-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Failed Students</span>
                  </div>
                  <p className="text-xl font-black text-rose-300">{classStats.failed}</p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center space-x-2 text-amber-300 text-xs font-semibold mb-1">
                    <Percent className="w-3.5 h-3.5" />
                    <span>Class Average</span>
                  </div>
                  <p className="text-xl font-black text-amber-300">{classStats.avgPct}%</p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
                  <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold mb-1">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Top Scorer</span>
                  </div>
                  <p className="text-sm font-black text-white truncate">
                    {classStats.top ? `${classStats.top.name}` : 'N/A'}
                  </p>
                  <p className="text-[11px] font-bold text-amber-300">
                    {classStats.top ? `${classStats.top.percentage}% (${classStats.top.grade})` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Search, Filter & Sort Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student name or roll number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      statusFilter === 'all'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({classStudents.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pass')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      statusFilter === 'pass'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Passed ({classStats.passed})
                  </button>
                  <button
                    onClick={() => setStatusFilter('fail')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      statusFilter === 'fail'
                        ? 'bg-white text-rose-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Failed ({classStats.failed})
                  </button>
                </div>

                {/* Sort Option */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-semibold">
                  <span>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="rank">By Rank (Highest %)</option>
                    <option value="rollNo">By Roll Number</option>
                    <option value="name">By Student Name</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Students Result Table */}
            {isClassLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold">Loading class marksheet records...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Student Records Found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  No students in this class match the selected filters.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">Rank</th>
                        <th className="py-3.5 px-4">Roll No</th>
                        <th className="py-3.5 px-4">Student Name</th>
                        <th className="py-3.5 px-3 text-center">Maths</th>
                        <th className="py-3.5 px-3 text-center">Science</th>
                        <th className="py-3.5 px-3 text-center">English</th>
                        <th className="py-3.5 px-3 text-center">Hindi</th>
                        <th className="py-3.5 px-3 text-center">Social</th>
                        <th className="py-3.5 px-4 text-center">Total (/500)</th>
                        <th className="py-3.5 px-4 text-center">Percentage</th>
                        <th className="py-3.5 px-3 text-center">Grade</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((student, idx) => {
                        const isTopRank = idx < 3 && sortBy === 'rank';
                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            {/* Rank */}
                            <td className="py-3 px-4 font-bold">
                              {isTopRank ? (
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black text-white ${
                                    idx === 0
                                      ? 'bg-amber-500 shadow-sm shadow-amber-500/40'
                                      : idx === 1
                                      ? 'bg-slate-400'
                                      : 'bg-amber-700'
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                              ) : (
                                <span className="text-slate-400">#{idx + 1}</span>
                              )}
                            </td>

                            {/* Roll No */}
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              #{student.rollNo}
                            </td>

                            {/* Name & Gender */}
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {student.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">{student.gender || 'Student'}</p>
                                </div>
                              </div>
                            </td>

                            {/* Subject Marks */}
                            <td className="py-3 px-3 text-center font-semibold">
                              <span
                                className={
                                  student.subjects.maths < 33
                                    ? 'text-rose-600 font-bold'
                                    : student.subjects.maths >= 75
                                    ? 'text-emerald-700 font-bold'
                                    : 'text-slate-700'
                                }
                              >
                                {student.subjects.maths}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center font-semibold">
                              <span
                                className={
                                  student.subjects.science < 33
                                    ? 'text-rose-600 font-bold'
                                    : student.subjects.science >= 75
                                    ? 'text-emerald-700 font-bold'
                                    : 'text-slate-700'
                                }
                              >
                                {student.subjects.science}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center font-semibold">
                              <span
                                className={
                                  student.subjects.english < 33
                                    ? 'text-rose-600 font-bold'
                                    : student.subjects.english >= 75
                                    ? 'text-emerald-700 font-bold'
                                    : 'text-slate-700'
                                }
                              >
                                {student.subjects.english}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center font-semibold">
                              <span
                                className={
                                  student.subjects.hindi < 33
                                    ? 'text-rose-600 font-bold'
                                    : student.subjects.hindi >= 75
                                    ? 'text-emerald-700 font-bold'
                                    : 'text-slate-700'
                                }
                              >
                                {student.subjects.hindi}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center font-semibold">
                              <span
                                className={
                                  student.subjects.socialScience < 33
                                    ? 'text-rose-600 font-bold'
                                    : student.subjects.socialScience >= 75
                                    ? 'text-emerald-700 font-bold'
                                    : 'text-slate-700'
                                }
                              >
                                {student.subjects.socialScience}
                              </span>
                            </td>

                            {/* Total Marks */}
                            <td className="py-3 px-4 text-center font-bold text-slate-900">
                              {student.totalMarks} / 500
                            </td>

                            {/* Percentage */}
                            <td className="py-3 px-4 text-center font-black text-indigo-700">
                              {student.percentage}%
                            </td>

                            {/* Grade */}
                            <td className="py-3 px-3 text-center font-black">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] ${
                                  student.grade === 'A+' || student.grade === 'A'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : student.grade === 'F'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {student.grade}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-center">
                              {student.status === 'Pass' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase">
                                  Pass
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold uppercase">
                                  Fail
                                </span>
                              )}
                            </td>

                            {/* Action: Open Individual Report Card */}
                            <td className="py-3 px-4 text-right print:hidden">
                              <button
                                onClick={() => onViewReportCard(student, classTeacher)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors"
                                title="Open full student report card"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Report Card</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 print:hidden mt-auto">
        <p>EduGrade Portal • Unified School & Class Results Repository</p>
      </footer>
    </div>
  );
};
