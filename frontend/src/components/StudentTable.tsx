import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  FileText,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import { Student } from '../types/student';
import { getGradeBadgeColor } from '../utils/calculations';

interface StudentTableProps {
  students: Student[];
  onOpenAddModal: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onViewReportCard: (student: Student) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onOpenAddModal,
  onEditStudent,
  onDeleteStudent,
  onViewReportCard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pass' | 'Fail'>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'percentage-desc' | 'percentage-asc' | 'roll-asc' | 'name-asc'>('percentage-desc');

  // Unique Classes list for filter dropdown
  const uniqueClasses = useMemo(() => {
    const set = new Set(students.map((s) => s.className));
    return Array.from(set);
  }, [students]);

  // Filtered & Sorted Student List
  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => {
        const matchesSearch =
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === 'ALL' || student.status === statusFilter;

        const matchesClass =
          classFilter === 'ALL' || student.className === classFilter;

        return matchesSearch && matchesStatus && matchesClass;
      })
      .sort((a, b) => {
        if (sortBy === 'percentage-desc') return b.percentage - a.percentage;
        if (sortBy === 'percentage-asc') return a.percentage - b.percentage;
        if (sortBy === 'roll-asc') return Number(a.rollNo) - Number(b.rollNo);
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [students, searchTerm, statusFilter, classFilter, sortBy]);

  // Export to CSV Functionality
  const exportToCSV = () => {
    if (filteredStudents.length === 0) return;

    const headers = [
      'Roll No',
      'Name',
      'Class',
      'Section',
      'Gender',
      'Maths',
      'Science',
      'English',
      'Hindi',
      'Social Science',
      'Total Marks',
      'Percentage (%)',
      'Grade',
      'Status',
    ];

    const rows = filteredStudents.map((s) => [
      s.rollNo,
      `"${s.name}"`,
      `"${s.className}"`,
      s.section,
      s.gender || 'N/A',
      s.subjects.maths,
      s.subjects.science,
      s.subjects.english,
      s.subjects.hindi,
      s.subjects.socialScience,
      s.totalMarks,
      s.percentage,
      s.grade,
      s.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `student_marks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Student Marks Directory</h2>
            <p className="text-xs text-slate-500">Manage, search, filter, and export student academic records</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportToCSV}
              disabled={filteredStudents.length === 0}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Record Student Marks</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Live Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Name or Roll No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Status (Pass / Fail)</option>
              <option value="Pass">Passed Students Only</option>
              <option value="Fail">Failed Students Only</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Grades / Classes</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-1">
            <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="percentage-desc">Percentage: High to Low</option>
              <option value="percentage-asc">Percentage: Low to High</option>
              <option value="roll-asc">Roll No: Ascending</option>
              <option value="name-asc">Student Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Roll No</th>
                <th className="py-3.5 px-4">Student Profile</th>
                <th className="py-3.5 px-4 text-center">Subject Breakdown</th>
                <th className="py-3.5 px-4 text-center">Total (500)</th>
                <th className="py-3.5 px-4 text-center">Percentage</th>
                <th className="py-3.5 px-4 text-center">Grade</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-indigo-50/40 transition-colors group"
                  >
                    {/* Roll No */}
                    <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                      #{student.rollNo}
                    </td>

                    {/* Student Info */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {student.className} • Sec {student.section} {student.gender ? `• ${student.gender}` : ''}
                      </div>
                    </td>

                    {/* Subject Marks Chips */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center justify-center gap-1.5 min-w-[240px]">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${student.subjects.maths < 33 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                          Math: {student.subjects.maths}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${student.subjects.science < 33 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                          Sci: {student.subjects.science}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${student.subjects.english < 33 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                          Eng: {student.subjects.english}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${student.subjects.hindi < 33 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                          Hin: {student.subjects.hindi}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${student.subjects.socialScience < 33 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                          Soc: {student.subjects.socialScience}
                        </span>
                      </div>
                    </td>

                    {/* Total Marks */}
                    <td className="py-4 px-4 text-center font-bold text-slate-800 whitespace-nowrap">
                      {student.totalMarks} / {student.maxTotalMarks}
                    </td>

                    {/* Percentage Bar & Number */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {student.percentage}%
                      </span>
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            student.percentage >= 75
                              ? 'bg-emerald-500'
                              : student.percentage >= 50
                              ? 'bg-blue-500'
                              : student.percentage >= 33
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(student.percentage, 100)}%` }}
                        />
                      </div>
                    </td>

                    {/* Grade */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block font-bold px-2.5 py-0.5 rounded-md border text-xs ${getGradeBadgeColor(
                          student.grade
                        )}`}
                      >
                        {student.grade}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {student.status === 'Pass' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
                          <XCircle className="w-3 h-3 mr-1" /> Fail
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onViewReportCard(student)}
                          title="View & Print Report Card"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditStudent(student)}
                          title="Edit Marks"
                          className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteStudent(student.id)}
                          title="Delete Record"
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No student records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try modifying your search or filter parameters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> enrolled students
          </span>
          <span>Passing threshold: 33 marks per subject</span>
        </div>
      </div>
    </div>
  );
};
