import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Download, PieChart, Users, FileCheck } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { StatsCard } from '../../components/common/StatsCard';

export const AdminReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await reportService.getAdminReports();
        if (res.success) setData(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAdmin();
  }, []);

  const summary = data?.summary || {};
  const managerStats = data?.managerStats || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Intelligence & Executive Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Executive performance metrics on hiring conversions, upload volumes, and departmental throughput.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard
          title="Total Resumes Uploaded"
          value={summary.totalResumes || 0}
          subtitle="All-time intake"
          icon={FileCheck}
          iconColor="text-teal-600 bg-teal-50"
        />
        <StatsCard
          title="Extracted Talent Pool"
          value={summary.totalCandidates || 0}
          subtitle="Structured profiles"
          icon={Users}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <StatsCard
          title="Active Job Requirements"
          value={summary.activeRequirements || 0}
          subtitle="Open vacancies"
          icon={BarChart3}
          iconColor="text-blue-600 bg-blue-50"
        />
        <StatsCard
          title="Selected for Offers"
          value={summary.selectedCandidates || 0}
          subtitle="Final selections"
          icon={TrendingUp}
          iconColor="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Manager Performance Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Departmental Manager Recruitment Conversion Metrics
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Manager</th>
                <th className="py-2.5 px-4">Classification</th>
                <th className="py-2.5 px-4 text-center">Assigned</th>
                <th className="py-2.5 px-4 text-center">Shortlisted</th>
                <th className="py-2.5 px-4 text-center">Rejected</th>
                <th className="py-2.5 px-4 text-center">Selected</th>
                <th className="py-2.5 px-4 text-center">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {managerStats.map((m: any) => {
                const rate = m.totalAssigned > 0 ? Math.round((m.selected / m.totalAssigned) * 100) : 0;
                return (
                  <tr key={m.managerId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{m.classification}</td>
                    <td className="py-3 px-4 text-center font-bold">{m.totalAssigned}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{m.shortlisted}</td>
                    <td className="py-3 px-4 text-center font-semibold text-rose-600">{m.rejected}</td>
                    <td className="py-3 px-4 text-center font-black text-teal-600">{m.selected}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-800">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

