import React from 'react';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Trophy,
  Award,
  BookOpen,
  ArrowRight,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { Student } from '../types/student';
import { Teacher } from '../types/auth';
import { computeDashboardStats, SUBJECT_NAMES, getGradeBadgeColor } from '../utils/calculations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardProps {
  students: Student[];
  teacher?: Teacher | null;
  onOpenAddModal: () => void;
  onNavigateToStudents: () => void;
  onViewReportCard: (student: Student) => void;
  onLoadSampleData?: () => void;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#10B981',
  A: '#22C55E',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  F: '#EF4444',
};

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  teacher,
  onOpenAddModal,
  onNavigateToStudents,
  onViewReportCard,
  onLoadSampleData,
}) => {
  const stats = computeDashboardStats(students);

  // Calculate Subject Averages for Chart
  const subjectAveragesData = React.useMemo(() => {
    if (students.length === 0) return [];

    const keys: (keyof typeof SUBJECT_NAMES)[] = [
      'maths',
      'science',
      'english',
      'hindi',
      'socialScience',
    ];

    return keys.map((key) => {
      const sum = students.reduce((acc, s) => acc + (s.subjects[key] || 0), 0);
      const avg = Number((sum / students.length).toFixed(1));
      return {
        subject: SUBJECT_NAMES[key],
        average: avg,
      };
    });
  }, [students]);

  // Grade Distribution Data for Pie Chart
  const gradeDistributionData = React.useMemo(() => {
    const counts: Record<string, number> = {
      'A+': 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };
    students.forEach((s) => {
      if (counts[s.grade] !== undefined) {
        counts[s.grade]++;
      } else {
        counts[s.grade] = 1;
      }
    });

    return Object.keys(counts)
      .filter((grade) => counts[grade] > 0)
      .map((grade) => ({
        name: `Grade ${grade}`,
        value: counts[grade],
        grade,
      }));
  }, [students]);

  // Top 3 Leaderboard
  const toppers = React.useMemo(() => {
    return [...students]
      .filter((s) => s.status === 'Pass')
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }, [students]);

  const classRoomTitle = teacher
    ? `${teacher.assignedClass} - Section ${teacher.assignedSection}`
    : 'Assigned Classroom';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-3">
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <span>{classRoomTitle} • Academic Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {classRoomTitle} Marks & Performance
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Record subject marks for your assigned classroom, track performance metrics, compute automated letter grades, and generate official student marksheets.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md transition-all hover:shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Marks ({classRoomTitle})</span>
            </button>
            <button
              onClick={onNavigateToStudents}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Classroom Students ({students.length})</span>
            </button>
            {students.length === 0 && onLoadSampleData && (
              <button
                onClick={onLoadSampleData}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md transition-all"
              >
                <span>⚡ Load 5 Sample Records</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute right-[-40px] top-[-40px] w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Classroom Students
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                {stats.totalStudents}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center">
            <span className="text-indigo-600 font-semibold mr-1">{classRoomTitle} roll</span>
          </p>
        </div>

        {/* Class Average */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Class Average Score
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                {stats.classAverage}%
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.classAverage, 100)}%` }}
            />
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Class Pass Rate
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">
                {stats.passPercentage}%
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-3">
            <span className="text-emerald-700 font-medium">Passed: {stats.passedStudents}</span>
            <span>•</span>
            <span className="text-rose-600 font-medium">Failed: {stats.failedStudents}</span>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Class Topper
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-1 truncate max-w-[150px]">
                {stats.topPerformer ? stats.topPerformer.name : 'N/A'}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {stats.topPerformer ? (
              <span className="text-amber-700 font-semibold">
                Score: {stats.highestPercentage}% (Roll #{stats.topPerformer.rollNo})
              </span>
            ) : (
              'No records yet'
            )}
          </p>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject-Wise Average Marks Bar Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center">
                <BookOpen className="w-5 h-5 text-indigo-600 mr-2" />
                Subject-wise Average Marks ({classRoomTitle})
              </h3>
              <p className="text-xs text-slate-500">Average score attained by students per subject</p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {subjectAveragesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAveragesData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="subject"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      border: 'none',
                    }}
                    formatter={(value: number) => [`${value} / 100`, 'Class Average']}
                  />
                  <Bar dataKey="average" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No marks recorded yet for {classRoomTitle}
              </div>
            )}
          </div>
        </div>

        {/* Grade Distribution Pie Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center">
              <Award className="w-5 h-5 text-indigo-600 mr-2" />
              Class Grade Distribution
            </h3>
            <p className="text-xs text-slate-500">Breakdown of student letter grades</p>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            {gradeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={GRADE_COLORS[entry.grade] || '#64748B'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      border: 'none',
                    }}
                    formatter={(val: number, name: string) => [
                      `${val} student(s)`,
                      name,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">No grades recorded yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Top 3 Toppers Leaderboard */}
      {toppers.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center">
                <Trophy className="w-5 h-5 text-amber-500 mr-2" />
                {classRoomTitle} Toppers & Honors
              </h3>
              <p className="text-xs text-slate-500">Top ranked students based on percentage</p>
            </div>
            <button
              onClick={onNavigateToStudents}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center"
            >
              View All Students <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {toppers.map((student, idx) => {
              const rankBadges = [
                { color: 'from-amber-400 to-amber-600 text-white', label: '1st Rank 🥇' },
                { color: 'from-slate-300 to-slate-500 text-white', label: '2nd Rank 🥈' },
                { color: 'from-amber-600 to-amber-800 text-white', label: '3rd Rank 🥉' },
              ];
              const currentBadge = rankBadges[idx] || rankBadges[0];

              return (
                <div
                  key={student.id}
                  className="relative overflow-hidden p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer group"
                  onClick={() => onViewReportCard(student)}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${currentBadge.color} shadow-xs`}
                    >
                      {currentBadge.label}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${getGradeBadgeColor(
                        student.grade
                      )}`}
                    >
                      Grade {student.grade}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {student.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Roll No: #{student.rollNo} • {student.className}-{student.section}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Percentage</span>
                      <p className="text-lg font-black text-slate-900">{student.percentage}%</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Total Marks</span>
                      <p className="text-sm font-bold text-slate-700">
                        {student.totalMarks} / {student.maxTotalMarks}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
