import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  School,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
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
  const [signUpSubject] = useState('Class Teacher');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Please enter both email and password.');
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
      setErrorMessage('An error occurred while connecting to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signUpName || !signUpEmail || !signUpPassword) {
      setErrorMessage('Please fill in all required fields.');
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
      setErrorMessage('An error occurred while connecting to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600/15 border border-indigo-500/20 rounded-2xl mb-3 shadow-inner">
          <GraduationCap className="w-8 h-8 text-indigo-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          EduGrade Portal
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Classroom Teacher & Academic Management
        </p>

        {/* Quick Portal Switcher Pills */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {onGoToStudentPortal && (
            <button
              type="button"
              onClick={onGoToStudentPortal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Student Portal</span>
            </button>
          )}

          {onGoToSchoolPortal && (
            <button
              type="button"
              onClick={onGoToSchoolPortal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <School className="w-3.5 h-3.5 text-emerald-400" />
              <span>School Results</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl py-7 px-6 sm:px-8 shadow-xl rounded-2xl border border-slate-800">
          
          {/* Tab Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
            <button
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Teacher Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Classroom
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Sign In Mode */}
          {mode === 'signin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Quick Demo Preset */}
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('teacher@school.edu');
                  setLoginPassword('password123');
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>⚡ Fill Demo Credentials (Class 10-A)</span>
              </button>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="teacher@school.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span className="flex items-center text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Class Teacher Access
                </span>
                <span className="text-[10px] text-slate-500">
                  Demo: teacher@school.edu
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Sign Up Mode */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Rajesh Sharma"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950/70 border border-slate-800 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Classroom Assignment */}
              <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-300 mb-1 flex items-center">
                    <Layers className="w-3 h-3 mr-1 text-amber-400" /> Assigned Class *
                  </label>
                  <select
                    value={assignedClass}
                    onChange={(e) => setAssignedClass(e.target.value)}
                    className="w-full py-1.5 px-2 bg-slate-900 border border-indigo-500/30 text-white rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
                  <label className="block text-[11px] font-semibold text-indigo-300 mb-1">
                    Section *
                  </label>
                  <select
                    value={assignedSection}
                    onChange={(e) => setAssignedSection(e.target.value)}
                    className="w-full py-1.5 px-2 bg-slate-900 border border-indigo-500/30 text-white rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="teacher@school.edu"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950/70 border border-slate-800 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  School / College Name
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Modern Public School"
                    value={signUpSchool}
                    onChange={(e) => setSignUpSchool(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950/70 border border-slate-800 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password (Min 6 chars) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950/70 border border-slate-800 text-white rounded-xl text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60"
              >
                <span>{isLoading ? 'Registering...' : `Register as ${assignedClass}-${assignedSection} Teacher`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Footer toggle */}
          <div className="mt-5 text-center">
            <p className="text-[11px] text-slate-500">
              {mode === 'signin' ? "Don't have an account?" : 'Already registered?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setErrorMessage(null);
                }}
                className="font-semibold text-indigo-400 hover:text-indigo-300 underline ml-1"
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
