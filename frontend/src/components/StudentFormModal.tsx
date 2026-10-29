import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { Student, StudentFormData } from '../types/student';
import { Teacher } from '../types/auth';
import { calculateStudentMetrics } from '../utils/calculations';

interface StudentFormModalProps {
  isOpen: boolean;
  teacher?: Teacher | null;
  onClose: () => void;
  onSave: (data: StudentFormData, editId?: string) => Promise<void>;
  editStudent?: Student | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  teacher,
  onClose,
  onSave,
  editStudent,
}) => {
  const [formData, setFormData] = useState<StudentFormData>({
    rollNo: '',
    name: '',
    className: teacher?.assignedClass || 'Class 10',
    section: teacher?.assignedSection || 'A',
    gender: 'Male',
    maths: '',
    science: '',
    english: '',
    hindi: '',
    socialScience: '',
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (editStudent) {
      setFormData({
        rollNo: editStudent.rollNo,
        name: editStudent.name,
        className: editStudent.className,
        section: editStudent.section,
        gender: editStudent.gender || 'Male',
        maths: editStudent.subjects.maths,
        science: editStudent.subjects.science,
        english: editStudent.subjects.english,
        hindi: editStudent.subjects.hindi,
        socialScience: editStudent.subjects.socialScience,
        remarks: editStudent.remarks || '',
        studentPin: editStudent.studentPin || (editStudent.rollNo ? `123$${editStudent.rollNo}` : ''),
      });
    } else {
      setFormData({
        rollNo: '',
        name: '',
        className: teacher?.assignedClass || 'Class 10',
        section: teacher?.assignedSection || 'A',
        gender: 'Male',
        maths: '',
        science: '',
        english: '',
        hindi: '',
        socialScience: '',
        remarks: '',
        studentPin: '',
      });
    }
    setErrors({});
    setSaveError('');
  }, [editStudent, isOpen, teacher]);

  if (!isOpen) return null;

  // Real-time calculation preview
  const previewMetrics = calculateStudentMetrics({
    maths: Number(formData.maths) || 0,
    science: Number(formData.science) || 0,
    english: Number(formData.english) || 0,
    hindi: Number(formData.hindi) || 0,
    socialScience: Number(formData.socialScience) || 0,
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.rollNo.trim()) errs.rollNo = 'Roll Number is required';
    if (!formData.name.trim()) errs.name = 'Student Full Name is required';

    const checkMark = (val: string | number, fieldName: string) => {
      if (val === '' || val === undefined) {
        errs[fieldName] = 'Marks required';
      } else {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 100) {
          errs[fieldName] = 'Enter score between 0 and 100';
        }
      }
    };

    checkMark(formData.maths, 'maths');
    checkMark(formData.science, 'science');
    checkMark(formData.english, 'english');
    checkMark(formData.hindi, 'hindi');
    checkMark(formData.socialScience, 'socialScience');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    setIsSaving(true);
    setSaveError('');
    try {
      const finalData = {
        ...formData,
        studentPin: formData.studentPin?.trim() || `123$${formData.rollNo.trim()}`,
      };
      await onSave(finalData, editStudent ? editStudent.id : undefined);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save the student record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Calculator className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {editStudent ? 'Edit Student Marks' : 'Record Student Marks'}
              </h3>
              <p className="text-xs text-indigo-100">
                {teacher
                  ? `Classroom: ${teacher.assignedClass} - Section ${teacher.assignedSection}`
                  : 'Enter student demographic details and subject marks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Student Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center">
              <span className="w-2 h-2 rounded-full bg-indigo-600 mr-2" />
              1. Student Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Roll Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 101"
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.rollNo ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                />
                {errors.rollNo && (
                  <p className="text-[10px] text-rose-600 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> {errors.rollNo}
                  </p>
                )}
              </div>

              {/* Student Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                />
                {errors.name && (
                  <p className="text-[10px] text-rose-600 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> {errors.name}
                  </p>
                )}
              </div>

              {/* Classroom Grade & Section Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Class
                </label>
                <div className="px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800 flex items-center">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 mr-1.5" />
                  {formData.className}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section
                </label>
                <div className="px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800">
                  Section {formData.section}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Student Login Security PIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Security PIN
                </label>
                <input
                  type="text"
                  placeholder={formData.rollNo ? `123$${formData.rollNo.trim()}` : '123$rollno'}
                  maxLength={25}
                  value={formData.studentPin || ''}
                  onChange={(e) => setFormData({ ...formData, studentPin: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">For Student Portal Login (Default: 123$RollNo)</span>
              </div>
            </div>
          </div>

          {/* Subject Marks Entry */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center">
              <span className="w-2 h-2 rounded-full bg-indigo-600 mr-2" />
              2. Subject Marks (Max: 100 Each, Pass: 33)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Mathematics */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mathematics *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={formData.maths}
                  onChange={(e) => setFormData({ ...formData, maths: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-bold text-center ${errors.maths ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                />
                {errors.maths && <p className="text-[10px] text-rose-600 mt-1">{errors.maths}</p>}
              </div>

              {/* Science */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Science *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={formData.science}
                  onChange={(e) => setFormData({ ...formData, science: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-bold text-center ${errors.science ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                />
                {errors.science && <p className="text-[10px] text-rose-600 mt-1">{errors.science}</p>}
              </div>

              {/* English */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">English *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={formData.english}
                  onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-bold text-center ${errors.english ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                />
                {errors.english && <p className="text-[10px] text-rose-600 mt-1">{errors.english}</p>}
              </div>

              {/* Hindi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hindi *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={formData.hindi}
                  onChange={(e) => setFormData({ ...formData, hindi: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-bold text-center ${errors.hindi ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                />
                {errors.hindi && <p className="text-[10px] text-rose-600 mt-1">{errors.hindi}</p>}
              </div>

              {/* Social Science */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Social Sci *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={formData.socialScience}
                  onChange={(e) => setFormData({ ...formData, socialScience: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-bold text-center ${errors.socialScience ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                />
                {errors.socialScience && (
                  <p className="text-[10px] text-rose-600 mt-1">{errors.socialScience}</p>
                )}
              </div>
            </div>
          </div>

          {/* Remarks / Teacher Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teacher's Remarks / Feedback (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Excellent progress in coursework and good class participation."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Real-time Live Calculation Box */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
                Live Result Computation
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${previewMetrics.status === 'Pass'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
              >
                Result: {previewMetrics.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/10">
              <div>
                <span className="text-[10px] text-slate-400">Total Marks</span>
                <p className="text-base font-black text-white">
                  {previewMetrics.totalMarks} / {previewMetrics.maxTotalMarks}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Percentage</span>
                <p className="text-base font-black text-amber-300">{previewMetrics.percentage}%</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Letter Grade</span>
                <p className="text-base font-black text-indigo-200">{previewMetrics.grade}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {saveError && (
            <p role="alert" className="text-xs text-rose-600">{saveError}</p>
          )}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all hover:shadow-indigo-500/30"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : editStudent ? 'Update Marks Record' : 'Save Marks Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
