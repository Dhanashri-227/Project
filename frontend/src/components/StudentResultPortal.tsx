import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  Printer,
  Award,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  LogOut,
  School,
  KeyRound,
  User,
} from 'lucide-react';
import { Student } from '../types/student';
import { Teacher } from '../types/auth';
import { apiStudentLogin } from '../services/api';
import { SUBJECT_NAMES, getGradeBadgeColor, PASSING_MARKS_PER_SUBJECT } from '../utils/calculations';

interface StudentResultPortalProps {
  onBackToTeacherPortal?: () => void;
  onGoToSchoolPortal?: () => void;
  onViewFullReportCard?: (student: Student, teacher?: Teacher | null) => void;
  isLoggedInTeacher?: boolean;
}

const STUDENT_SESSION_KEY = 'edugrade_student_auth_session';

export const StudentResultPortal: React.FC<StudentResultPortalProps> = ({
  onBackToTeacherPortal,
  onGoToSchoolPortal,
  onViewFullReportCard,
  isLoggedInTeacher = false,
}) => {
  // Login Form State
  const [rollNo, setRollNo] = useState('');
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authenticated Student State
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
  const [studentTeacher, setStudentTeacher] = useState<Teacher | null>(null);

  // Check existing student session on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STUDENT_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.student) {
          setLoggedInStudent(parsed.student);
          if (parsed.teacher) setStudentTeacher(parsed.teacher);
        }
      }
    } catch {
      // ignore parse error
    }
  }, []);


  // Perform Secure Authentication
  const performLogin = async (
    loginRoll: string,
    cls: string,
    sec: string,
    loginPin: string
  ) => {
    if (!loginRoll.trim()) {
      setErrorMessage('Please enter your Roll Number.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiStudentLogin(loginRoll, cls, sec, loginPin);
      if (response.success && response.data) {
        setLoggedInStudent(response.data);
        setStudentTeacher(response.teacher || null);

        // Save session
        sessionStorage.setItem(
          STUDENT_SESSION_KEY,
          JSON.stringify({ student: response.data, teacher: response.teacher })
        );
      } else {
        setErrorMessage(
          response.message || `Invalid credentials. PIN format is 123$${loginRoll.trim() || 'RollNo'}.`
        );
      }
    } catch {
      setErrorMessage('Unable to connect to marks database. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(rollNo, selectedClass, selectedSection, pin);
  };

  // Sign out student
  const handleStudentLogout = () => {
    sessionStorage.removeItem(STUDENT_SESSION_KEY);
    setLoggedInStudent(null);
    setStudentTeacher(null);
    setPin('');
    setErrorMessage(null);
  };

  const handlePrintResult = () => {
    window.print();
  };

  const subjectList = loggedInStudent
    ? [
        { code: '101', name: SUBJECT_NAMES.maths, marks: loggedInStudent.subjects.maths },
        { code: '102', name: SUBJECT_NAMES.science, marks: loggedInStudent.subjects.science },
        { code: '103', name: SUBJECT_NAMES.english, marks: loggedInStudent.subjects.english },
        { code: '104', name: SUBJECT_NAMES.hindi, marks: loggedInStudent.subjects.hindi },
        { code: '105', name: SUBJECT_NAMES.socialScience, marks: loggedInStudent.subjects.socialScience },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header Banner */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border-b border-indigo-900/50 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-indigo-600/30 rounded-2xl border border-indigo-400/30 backdrop-blur-md shadow-inner">
                <GraduationCap className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
                    EduGrade Student Portal
                  </h1>
                  <span className="hidden sm:inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Secure Student Access
                  </span>
                </div>
                <p className="text-xs text-indigo-300">
                  Protected Academic Marksheet & Result Verification Portal
                </p>
              </div>
            </div>

            {/* Actions: Switch to Teacher Portal or Sign Out */}
            <div className="flex items-center space-x-2.5">
              {loggedInStudent && (
                <button
                  onClick={handleStudentLogout}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-400/30 text-xs font-bold transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}

              {onGoToSchoolPortal && (
                <button
                  onClick={onGoToSchoolPortal}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-xs font-bold text-emerald-200 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
                  title="Browse results by School & Class"
                >
                  <School className="w-4 h-4 text-emerald-300" />
                  <span className="hidden sm:inline">School Results</span>
                </button>
              )}

              {onBackToTeacherPortal && (
                <button
                  onClick={onBackToTeacherPortal}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-300" />
                  <span>{isLoggedInTeacher ? 'Teacher Dashboard' : 'Teacher Portal Login'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* State 1: Secure Student Login Screen */}
        {!loggedInStudent ? (
          <div className="max-w-lg mx-auto py-6">
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 relative overflow-hidden">
              {/* Decorative top accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-600 via-teal-500 to-amber-400" />

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl mb-3 shadow-inner">
                  <Lock className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Student Sign In
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Enter your Roll Number and Security PIN to access your examination results.
                </p>
                <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Confidential & Encrypted Record Access</span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Roll Number Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Roll Number *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 101, 102, 103..."
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Class & Section Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Class
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                    >
                      <option value="Class 6">Class 6</option>
                      <option value="Class 7">Class 7</option>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Section
                    </label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>

                {/* Security PIN / Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Security Access PIN *
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Default PIN: 123$RollNo</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      placeholder="Enter PIN (e.g. 123$101)"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-inner font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Unlock & View My Marksheet</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}


            </div>
          </div>
        ) : (
          /* State 2: Authenticated Student Marksheet View */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Top Student Authenticated Profile Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-extrabold uppercase">
                      Roll #{loggedInStudent.rollNo}
                    </span>
                    <span className="text-xs font-bold text-indigo-300">
                      {loggedInStudent.className} - Section {loggedInStudent.section}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Authenticated
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                    {loggedInStudent.name}
                  </h2>
                  <p className="text-xs text-indigo-200 mt-1 flex items-center">
                    <School className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                    {studentTeacher?.schoolName || 'Central Academy Senior Secondary School'}
                  </p>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Pass / Fail Badge */}
                  <div
                    className={`px-5 py-2.5 rounded-2xl flex items-center space-x-2 font-black text-sm shadow-lg ${
                      loggedInStudent.status === 'Pass'
                        ? 'bg-emerald-500 text-white shadow-emerald-900/40'
                        : 'bg-rose-500 text-white shadow-rose-900/40'
                    }`}
                  >
                    {loggedInStudent.status === 'Pass' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    <span>{loggedInStudent.status === 'Pass' ? 'RESULT: PASSED' : 'RESULT: NEEDS IMPROVEMENT'}</span>
                  </div>

                  {/* Print Marksheet Button */}
                  <button
                    onClick={handlePrintResult}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all hover:scale-105"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>Print Result</span>
                  </button>

                  {/* Open Official Certificate Button */}
                  {onViewFullReportCard && (
                    <button
                      onClick={() => onViewFullReportCard(loggedInStudent, studentTeacher)}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md hover:scale-105"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Official Certificate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Marks</span>
                <div className="mt-2 flex items-baseline space-x-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{loggedInStudent.totalMarks}</span>
                  <span className="text-xs text-slate-400 font-semibold">/ 500</span>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-indigo-600">
                  Passing Mark: 165 / 500
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Percentage</span>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-indigo-600">{loggedInStudent.percentage}%</span>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-slate-500">
                  {loggedInStudent.percentage >= 75 ? 'First Division with Distinction' : loggedInStudent.percentage >= 60 ? 'First Division' : loggedInStudent.percentage >= 33 ? 'Passed' : 'Below 33%'}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Grade</span>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-xl text-xl font-black border ${getGradeBadgeColor(loggedInStudent.grade)}`}>
                    Grade {loggedInStudent.grade}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-slate-500">
                  {loggedInStudent.grade === 'A+' ? 'Outstanding' : loggedInStudent.grade === 'A' ? 'Excellent' : loggedInStudent.grade === 'B' ? 'Very Good' : loggedInStudent.grade === 'C' ? 'Good' : 'Satisfactory / Remedial'}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Academic Standing</span>
                <div className="mt-2">
                  <span className={`text-base sm:text-lg font-black ${loggedInStudent.status === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {loggedInStudent.status === 'Pass' ? 'PASSED & PROMOTED' : 'NEEDS RE-EXAM'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-slate-500">
                  Academic Year 2025-2026
                </div>
              </div>
            </div>

            {/* Subject Marks Breakdown Table */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Subject-Wise Marksheet Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Individual subject performance, evaluation marks, and grades.
                  </p>
                </div>
                <span className="inline-flex items-center text-xs font-bold text-slate-600 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 w-fit">
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                  Passing Mark: 33 / 100 per Subject
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                      <th className="py-3.5 px-4 text-center w-16">Code</th>
                      <th className="py-3.5 px-6">Subject</th>
                      <th className="py-3.5 px-4 text-center">Max Marks</th>
                      <th className="py-3.5 px-4 text-center">Pass Marks</th>
                      <th className="py-3.5 px-4 text-center">Marks Obtained</th>
                      <th className="py-3.5 px-4 text-center">Performance Bar</th>
                      <th className="py-3.5 px-4 text-center">Grade</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjectList.map((sub, index) => {
                      const isPass = sub.marks >= PASSING_MARKS_PER_SUBJECT;
                      return (
                        <tr key={sub.code} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                          <td className="py-4 px-4 text-center font-mono font-bold text-slate-500">
                            {sub.code}
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-900">
                            {sub.name}
                          </td>
                          <td className="py-4 px-4 text-center text-slate-600 font-semibold">100</td>
                          <td className="py-4 px-4 text-center text-slate-600 font-semibold">33</td>
                          <td className="py-4 px-4 text-center font-black text-slate-900 text-base">
                            {sub.marks}
                          </td>
                          <td className="py-4 px-4">
                            <div className="w-32 mx-auto">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                <span>{sub.marks}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    sub.marks >= 80
                                      ? 'bg-emerald-500'
                                      : sub.marks >= 60
                                      ? 'bg-indigo-500'
                                      : sub.marks >= 33
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, sub.marks)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-black">
                            <span className={`px-2 py-0.5 rounded font-black text-xs ${
                              sub.marks >= 90 ? 'text-emerald-700 bg-emerald-50' :
                              sub.marks >= 80 ? 'text-green-700 bg-green-50' :
                              sub.marks >= 70 ? 'text-blue-700 bg-blue-50' :
                              sub.marks >= 60 ? 'text-amber-700 bg-amber-50' :
                              sub.marks >= 33 ? 'text-orange-700 bg-orange-50' :
                              'text-rose-700 bg-rose-50'
                            }`}>
                              {sub.marks >= 90 ? 'A+' : sub.marks >= 80 ? 'A' : sub.marks >= 70 ? 'B' : sub.marks >= 60 ? 'C' : sub.marks >= 33 ? 'D' : 'F'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isPass ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black text-xs sm:text-sm">
                      <td colSpan={2} className="py-4 px-6 uppercase tracking-wider">
                        GRAND TOTAL AGGREGATE
                      </td>
                      <td className="py-4 px-4 text-center">500</td>
                      <td className="py-4 px-4 text-center">165</td>
                      <td className="py-4 px-4 text-center text-amber-300 text-lg font-black">
                        {loggedInStudent.totalMarks}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-200">
                        {loggedInStudent.percentage}% Aggregate
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${getGradeBadgeColor(loggedInStudent.grade)}`}>
                          {loggedInStudent.grade}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                            loggedInStudent.status === 'Pass'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {loggedInStudent.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Teacher Remarks Box */}
            {loggedInStudent.remarks && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 shadow-sm">
                <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider block mb-1">
                  Teacher's Evaluation Assessment & Remarks:
                </span>
                <p className="text-amber-900 text-sm italic font-medium">
                  "{loggedInStudent.remarks}"
                </p>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 print:hidden">
              <button
                onClick={handleStudentLogout}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                <span>Sign Out of Student Account</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrintResult}
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md hover:scale-105"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Marksheet PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto print:hidden">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            EduGrade Online Student Examination & Result Portal
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Protected by Secure Student Authentication & Marksheet Verification Protocol
          </p>
        </div>
      </footer>
    </div>
  );
};
