import React, { useEffect } from 'react';
import { X, Printer, GraduationCap, Award, CheckCircle2, XCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Student } from '../types/student';
import { Teacher } from '../types/auth';
import { SUBJECT_NAMES, getGradeBadgeColor, PASSING_MARKS_PER_SUBJECT } from '../utils/calculations';

interface ReportCardModalProps {
  student: Student | null;
  teacher?: Teacher | null;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  student,
  teacher,
  onClose,
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (student) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [student, onClose]);

  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const subjectList = [
    { code: '101', name: SUBJECT_NAMES.maths, marks: student.subjects.maths },
    { code: '102', name: SUBJECT_NAMES.science, marks: student.subjects.science },
    { code: '103', name: SUBJECT_NAMES.english, marks: student.subjects.english },
    { code: '104', name: SUBJECT_NAMES.hindi, marks: student.subjects.hindi },
    { code: '105', name: SUBJECT_NAMES.socialScience, marks: student.subjects.socialScience },
  ];

  const schoolTitle = teacher?.schoolName
    ? teacher.schoolName.toUpperCase()
    : 'CENTRAL ACADEMY SENIOR SECONDARY SCHOOL';

  const issueDate = new Date(student.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white"
      onClick={onClose} // Clicking anywhere outside closes the modal
    >
      {/* Modal Card Container (Stop propagation so clicking inside does not close) */}
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-6 print:my-0 print:border-none print:shadow-none animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (Hidden during Print) */}
        <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
              title="Close Marksheet (Press Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back / Close</span>
            </button>
            <span className="hidden sm:inline-block text-slate-400 text-xs pl-2">
              Student Marksheet Preview
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              title="Close (Esc)"
              className="inline-flex items-center justify-center p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Marksheet Container */}
        <div className="p-6 sm:p-10 bg-white text-slate-900 print:p-4" id="marksheet-print-area">
          
          {/* Certificate Decorative Border */}
          <div className="border-4 border-double border-slate-800 p-6 sm:p-8 rounded-lg relative overflow-hidden bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:16px_16px]">
            
            {/* Background Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <GraduationCap className="w-[450px] h-[450px] text-slate-900" />
            </div>

            {/* Header / Institution Emblem & Title */}
            <div className="text-center pb-6 border-b-2 border-slate-800 relative z-10">
              <div className="inline-flex items-center justify-center p-2.5 bg-slate-900 text-amber-400 rounded-xl mb-2 shadow-sm">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-wider text-slate-900 uppercase">
                {schoolTitle}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-600 uppercase font-semibold tracking-widest mt-1">
                Affiliated to Recognized Board of Secondary Education
              </p>
              <div className="mt-3 inline-block px-5 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest shadow-xs">
                ANNUAL STATEMENT OF MARKS & PROGRESS REPORT
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                ACADEMIC SESSION 2025 - 2026
              </p>
            </div>

            {/* Student Profile & Demographic Information Box */}
            <div className="my-6 p-4 rounded-xl border border-slate-300 bg-slate-50/80 relative z-10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Candidate Name</span>
                  <p className="font-extrabold text-slate-900 text-sm">{student.name}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Roll Number</span>
                  <p className="font-black text-indigo-900 text-sm">#{student.rollNo}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Class & Section</span>
                  <p className="font-bold text-slate-900 text-sm">{student.className} - {student.section}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gender</span>
                  <p className="font-bold text-slate-900 text-sm">{student.gender || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Class Teacher</span>
                  <p className="font-bold text-slate-800 text-xs">{teacher?.name || 'Faculty In-Charge'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Issue Date</span>
                  <p className="font-medium text-slate-800 text-xs">{issueDate}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Evaluation Type</span>
                  <p className="font-medium text-slate-800 text-xs">Comprehensive Continuous Assessment (CCE)</p>
                </div>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="my-6 border-2 border-slate-800 rounded-lg overflow-hidden shadow-xs relative z-10 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-900">
                    <th className="py-2.5 px-3 w-16 text-center border-r border-slate-700">Code</th>
                    <th className="py-2.5 px-4 border-r border-slate-700">Subject Description</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-700">Max Marks</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-700">Pass Marks</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-700">Marks Obtained</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-700">Percentage</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-700">Grade</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {subjectList.map((sub, idx) => {
                    const isPass = sub.marks >= PASSING_MARKS_PER_SUBJECT;
                    return (
                      <tr
                        key={sub.code}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600 border-r border-slate-200">
                          {sub.code}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                          {sub.name}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 border-r border-slate-200">100</td>
                        <td className="py-2.5 px-3 text-center text-slate-600 border-r border-slate-200">33</td>
                        <td className="py-2.5 px-3 text-center font-black text-slate-900 border-r border-slate-200 text-sm">
                          {sub.marks}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-700 border-r border-slate-200">
                          {sub.marks}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold border-r border-slate-200">
                          {sub.marks >= 90 ? 'A+' : sub.marks >= 80 ? 'A' : sub.marks >= 70 ? 'B' : sub.marks >= 60 ? 'C' : sub.marks >= 33 ? 'D' : 'F'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-black text-[10px] ${
                              isPass ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                            }`}
                          >
                            {isPass ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-800 text-xs">
                    <td colSpan={2} className="py-3 px-4 text-slate-900 uppercase border-r border-slate-300">
                      GRAND TOTAL AGGREGATE
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700 border-r border-slate-300">500</td>
                    <td className="py-3 px-3 text-center text-slate-700 border-r border-slate-300">165</td>
                    <td className="py-3 px-3 text-center text-indigo-900 font-black text-base border-r border-slate-300">
                      {student.totalMarks}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-900 font-black text-sm border-r border-slate-300">
                      {student.percentage}%
                    </td>
                    <td className="py-3 px-3 text-center border-r border-slate-300">
                      <span className={`px-2 py-0.5 rounded font-black ${getGradeBadgeColor(student.grade)}`}>
                        {student.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-black">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-xs font-black ${
                          student.status === 'Pass'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                        }`}
                      >
                        {student.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Performance Analysis & Standing Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 relative z-10">
              {/* Aggregate Score Card */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Score</span>
                  <p className="text-xl font-black text-slate-900">{student.totalMarks} <span className="text-xs text-slate-500 font-normal">/ 500</span></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Percentage</span>
                  <p className="text-xl font-black text-indigo-700">{student.percentage}%</p>
                </div>
              </div>

              {/* Overall Grade Card */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Final Grade</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">Grade {student.grade}</p>
                </div>
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
                  <Award className="w-5 h-5" />
                </div>
              </div>

              {/* Academic Division / Standing Card */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Academic Result</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  {student.status === 'Pass' ? (
                    <span className="text-emerald-700 font-extrabold text-sm flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                      {student.percentage >= 75
                        ? 'Distinction (1st Div)'
                        : student.percentage >= 60
                        ? 'First Division'
                        : student.percentage >= 50
                        ? 'Second Division'
                        : 'Third Division'}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-extrabold text-sm flex items-center">
                      <XCircle className="w-4 h-4 mr-1 text-rose-500" />
                      Needs Remedial Exam
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks Section */}
            {student.remarks && (
              <div className="my-4 p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 text-xs relative z-10">
                <span className="font-bold text-amber-950 uppercase text-[10px] tracking-wider block mb-0.5">
                  Teacher's Assessment & Remarks:
                </span>
                <p className="text-amber-900 italic font-medium">"{student.remarks}"</p>
              </div>
            )}

            {/* Grading System Reference Legend */}
            <div className="my-4 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-[10px] text-slate-600 flex flex-wrap justify-between items-center gap-1.5 relative z-10">
              <span className="font-bold text-slate-800">Grading Scale:</span>
              <span>A+ (90-100%): Outstanding</span>
              <span>•</span>
              <span>A (80-89%): Excellent</span>
              <span>•</span>
              <span>B (70-79%): Very Good</span>
              <span>•</span>
              <span>C (60-69%): Good</span>
              <span>•</span>
              <span>D (33-59%): Pass</span>
              <span>•</span>
              <span>F (&lt;33%): Fail</span>
            </div>

            {/* Official Signatures & Seal Block */}
            <div className="mt-10 pt-6 border-t border-slate-300 grid grid-cols-3 text-center text-xs text-slate-700 relative z-10">
              <div className="flex flex-col justify-end items-center">
                <div className="h-9 flex items-end justify-center font-bold text-slate-800 font-serif text-sm">
                  {teacher?.name || 'Class Teacher'}
                </div>
                <div className="w-40 border-t-2 border-slate-800 mt-1 pt-1 font-bold uppercase text-[10px] tracking-wider">
                  Class Teacher
                </div>
              </div>

              <div className="flex flex-col justify-end items-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-900 flex flex-col items-center justify-center p-1 text-[8px] font-black text-indigo-900 uppercase tracking-tighter">
                  <span>OFFICIAL</span>
                  <span>SEAL</span>
                </div>
                <div className="w-40 border-t-2 border-slate-800 mt-2 pt-1 font-bold uppercase text-[10px] tracking-wider">
                  Exam Controller
                </div>
              </div>

              <div className="flex flex-col justify-end items-center">
                <div className="h-9"></div>
                <div className="w-40 border-t-2 border-slate-800 mt-1 pt-1 font-bold uppercase text-[10px] tracking-wider">
                  Principal / Head
                </div>
              </div>
            </div>

            {/* Bottom Security Footer */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 uppercase tracking-widest relative z-10">
              This is a computer-generated academic transcript • Authenticated by EduGrade Portal
            </div>

          </div>
        </div>

        {/* Bottom Actions Bar (Hidden during Print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
          >
            <X className="w-4 h-4 mr-1 text-slate-500" />
            <span>Close Marksheet</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px] text-slate-700">Esc</kbd> key to close
            </span>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
