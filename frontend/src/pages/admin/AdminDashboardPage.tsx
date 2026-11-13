import React, { useEffect, useState } from 'react';
import {
  Users,
  Briefcase,
  FileText,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { reportService } from '../../services/reportService';
import { StatsCard } from '../../components/common/StatsCard';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { ClassificationBadge, StatusBadge } from '../../components/common/Badge';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await reportService.getAdminReports();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const departmentData = data?.departmentDistribution || [];
  const monthlyTrends = data?.monthlyTrends || [];
  const managerStats = data?.managerStats || [];
  const hrStats = data?.hrStats || [];
  const recentActivities = data?.recentActivities || [];

  const PIE_COLORS = ['#0D9488', '#6366F1', '#D97706'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Admin Master Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global monitoring of recruitment pipelines, AI screenings, and departmental manager allocations.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Candidates"
          value={summary.totalCandidates || 0}
          subtitle="Extracted & registered candidates"
          icon={Layers}
          iconColor="text-teal-600 bg-teal-50"
        />
        <StatsCard
          title="Resumes Uploaded"
          value={summary.totalResumes || 0}
          subtitle={`${summary.processedResumes || 0} AI processed successfully`}
          icon={FileText}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <StatsCard
          title="Active Job Requirements"
          value={summary.activeRequirements || 0}
          subtitle="Across IT, Legal & Field Exec"
          icon={Briefcase}
          iconColor="text-blue-600 bg-blue-50"
        />
        <StatsCard
          title="Manager Assignments"
          value={summary.assignedCandidates || 0}
          subtitle={`${summary.shortlistedCandidates || 0} shortlisted`}
          icon={UserCheck}
          iconColor="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="text-center p-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total HR Users
          </span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{summary.totalHR || 0}</p>
        </div>
        <div className="text-center p-2 border-l border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Managers
          </span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{summary.totalManagers || 0}</p>
        </div>
        <div className="text-center p-2 border-l border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending Processing
          </span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">{summary.pendingResumes || 0}</p>
        </div>
        <div className="text-center p-2 border-l border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Final Selected
          </span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{summary.selectedCandidates || 0}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruitment Trends Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recruitment Velocity & Trends</h3>
              <p className="text-xs text-slate-500">Monthly uploads vs shortlisted candidates</p>
            </div>
            <span className="text-xs font-semibold text-teal-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Real-time Aggregation
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorShortlist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="uploads"
                  stroke="#0D9488"
                  fillOpacity={1}
                  fill="url(#colorUploads)"
                  name="Resumes Uploaded"
                />
                <Area
                  type="monotone"
                  dataKey="shortlisted"
                  stroke="#6366F1"
                  fillOpacity={1}
                  fill="url(#colorShortlist)"
                  name="Candidates Shortlisted"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Department Distribution</h3>
            <p className="text-xs text-slate-500">Candidate pool across classifications</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {departmentData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
            {departmentData.map((dept: any, i: number) => (
              <div key={dept.name}>
                <div className="flex items-center justify-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-[10px] font-semibold text-slate-600 truncate">
                    {dept.name.split(' ')[0]}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{dept.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Managers & HR Statistics Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manager-wise Recruitment Stats */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Departmental Managers Performance
            </h3>
            <span className="text-xs text-slate-500">{managerStats.length} Managers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Manager</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4 text-center">Assigned</th>
                  <th className="py-2.5 px-4 text-center">Shortlist</th>
                  <th className="py-2.5 px-4 text-center">Selected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {managerStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No managers created yet.
                    </td>
                  </tr>
                ) : (
                  managerStats.map((m: any) => (
                    <tr key={m.managerId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{m.name}</td>
                      <td className="py-3 px-4">
                        <ClassificationBadge classification={m.classification} />
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{m.totalAssigned}</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-semibold">
                        {m.shortlisted}
                      </td>
                      <td className="py-3 px-4 text-center text-teal-600 font-bold">
                        {m.selected}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* HR-wise Upload Statistics */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              HR Resume Upload Statistics
            </h3>
            <span className="text-xs text-slate-500">{hrStats.length} HR Personnel</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">HR Personnel</th>
                  <th className="py-2.5 px-4">Corporate Email</th>
                  <th className="py-2.5 px-4 text-right">Total Uploads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {hrStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No HR personnel found.
                    </td>
                  </tr>
                ) : (
                  hrStats.map((h: any) => (
                    <tr key={h.hrId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{h.name}</td>
                      <td className="py-3 px-4 text-slate-500">{h.email}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {h.totalUploads} resumes
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity Log Stream */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
          Recent Application Activity Stream
        </h3>

        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No activity recorded yet</div>
          ) : (
            recentActivities.map((act: any) => (
              <div
                key={act._id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50/60 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <div>
                    <span className="font-semibold text-slate-900">
                      {act.userId?.name || 'System'}
                    </span>{' '}
                    <span className="text-slate-500">performed</span>{' '}
                    <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {act.action}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(act.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

