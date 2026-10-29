import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  School,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
} from 'lucide-react';
import { Teacher } from '../types/auth';
import { apiLoginTeacher, apiRegisterTeacher } from '../services/api';

interface TeacherAuthProps {
  onLoginSuccess: (teacher: Teacher) => void;
  onGoToStudentPortal?: () => void;
  onGoToSchoolPortal?: () => void;
}

export const TeacherAuth: React.FC<TeacherAuthProps> = ({
  onLoginSuccess,
  onGoToStudentPortal,
  onGoToSchoolPortal,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpSchool, setSignUpSchool] = useState('');
  const [assignedClass, setAssignedClass] = useState('Class 10');
  const [assignedSection, setAssignedSection] = useState('A');
  const [signUpSubject, setSignUpSubject] = useState('Class Teacher');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiLoginTeacher(loginEmail, loginPassword);
      if (result.success && result.teacher) {
        onLoginSuccess(result.teacher);
      } else {
        setErrorMessage(result.message);
      }
    } catch {
      setErrorMessage('An error occurred while connecting to the database server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signUpName || !signUpEmail || !signUpPassword) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRegisterTeacher({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        schoolName: signUpSchool || 'Academic Institution',
        assignedClass,
        assignedSection,
        subjectSpecialization: signUpSubject || 'Class Teacher',
      });

      if (result.success && result.teacher) {
        setSuccessMessage(`Registered as Class Teacher for ${assignedClass} - Section ${assignedSection}!`);
        setTimeout(() => {
          if (result.teacher) onLoginSuccess(result.teacher);
        }, 600);
      } else {
        setErrorMessage(result.message);
      }
    } catch {
      setErrorMessage('An error occurred while connecting to the database server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-xl shadow-indigo-500/20 border border-white/20 mb-3">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          EduGrade Portal
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Classroom Teacher Login & Marks Portal
        </p>

        {/* Database Connected Badge */}
        <div className="mt-3 flex items-center justify-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
            <Database className="w-3 h-3 mr-1.5 text-emerald-400" />
            MongoDB Storage Active
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Student Result Portal Quick Link Banner */}
        {onGoToStudentPortal && (
          <button
            type="button"
            onClick={onGoToStudentPortal}
            className="w-full mb-3 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-between shadow-xl shadow-emerald-950/40 border border-emerald-400/30 transition-all hover:scale-[1.02] active:scale-[0.99] group"
          >
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-white/20 text-white">
                <GraduationCap className="w-4 h-4 text-amber-300" />
              </span>
              <div className="text-left">
                <p className="font-extrabold text-white leading-tight">
                  Student Login Portal
                </p>
                <p className="text-[10px] text-emerald-100 font-medium">
                  Sign in with Roll No & PIN to view Marksheet →
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider group-hover:bg-white group-hover:text-emerald-900 transition-colors">
              Student Login
            </span>
          </button>
        )}

        {/* School Results Portal Quick Link Banner */}
        {onGoToSchoolPortal && (
          <button
            type="button"
            onClick={onGoToSchoolPortal}
            className="w-full mb-4 py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-800 hover:from-teal-600 hover:to-slate-700 text-white font-bold text-xs flex items-center justify-between shadow-xl shadow-teal-950/40 border border-emerald-400/30 transition-all hover:scale-[1.02] active:scale-[0.99] group"
          >
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-white/20 text-white">
                <School className="w-4 h-4 text-amber-300" />
              </span>
              <div className="text-left">
                <p className="font-extrabold text-white leading-tight">
                  School & Class Results
                </p>
                <p className="text-[10px] text-emerald-200 font-medium">
                  Browse results across different schools & classes →
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider group-hover:bg-white group-hover:text-emerald-900 transition-colors">
              School Portal
            </span>
          </button>
        )}

        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800">
          
          {/* Tab Switcher: Sign In vs Sign Up */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 mb-6">
            <button
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Teacher Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Classroom
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

              {/* Mode 1: Teacher Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Quick Demo Login Preset Button */}
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('teacher@school.edu');
                  setLoginPassword('password123');
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 hover:bg-amber-400/20 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>⚡ Fill Demo Credentials (Class 10-A)</span>
              </button>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Teacher Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Private Classroom Access
                </span>
                <span className="text-[10px] text-slate-500">
                  Demo: teacher@school.edu
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In to Classroom Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Mode 2: Teacher Sign Up Form with Classroom Selection */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name & Title *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Rajesh Sharma"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-700 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Classroom Teacher Assignment Dropdowns */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-300 mb-1 flex items-center">
                    <Layers className="w-3 h-3 mr-1 text-amber-300" /> Assigned Class *
                  </label>
                  <select
                    value={assignedClass}
                    onChange={(e) => setAssignedClass(e.target.value)}
                    className="w-full py-1.5 px-2.5 bg-slate-900 border border-indigo-500/50 text-white rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                  <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                    Section *
                  </label>
                  <select
                    value={assignedSection}
                    onChange={(e) => setAssignedSection(e.target.value)}
                    className="w-full py-1.5 px-2.5 bg-slate-900 border border-indigo-500/50 text-white rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="teacher@school.edu"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-700 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  School / College Name
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Modern Public School"
                    value={signUpSchool}
                    onChange={(e) => setSignUpSchool(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-700 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Set Password (Min 6 chars) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-700 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                <span>{isLoading ? 'Saving...' : `Register as ${assignedClass}-${assignedSection} Teacher`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <p className="text-[11px] text-slate-500">
              {mode === 'signin' ? "Don't have an account yet?" : 'Already have a registered account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setErrorMessage(null);
                }}
                className="font-bold text-indigo-400 hover:text-indigo-300 underline"
              >
                {mode === 'signin' ? 'Register Classroom Teacher' : 'Sign In instead'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
