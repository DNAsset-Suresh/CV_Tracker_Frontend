import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Download, PieChart, Users, FileCheck } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { StatsCard } from '../../components/common/StatsCard';

export const HRReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await reportService.getHRReports();
        if (res.success) setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const metrics = data?.metrics || {};
  const requirementStats = data?.requirementStats || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">HR Recruitment Reports & Metrics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Performance analytics on resume intake, conversion rates, and requirement allocations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Resumes Processed"
          value={metrics.totalUploads || 0}
          subtitle={`${metrics.successfulExtractions || 0} successfully extracted`}
          icon={FileCheck}
          iconColor="text-teal-600 bg-teal-50"
        />
        <StatsCard
          title="Unassigned Candidate Pool"
          value={metrics.unassignedCandidates || 0}
          subtitle="Ready for manager allocation"
          icon={Users}
          iconColor="text-amber-600 bg-amber-50"
        />
        <StatsCard
          title="Active Candidates in Pipeline"
          value={metrics.assignedCandidates || 0}
          subtitle="Assigned to departmental managers"
          icon={TrendingUp}
          iconColor="text-indigo-600 bg-indigo-50"
        />
      </div>

      {/* Requirement Distribution Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Job Requirement Candidate Allocation Audit
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Requirement ID</th>
                <th className="py-2.5 px-4">Job Title</th>
                <th className="py-2.5 px-4">Department Classification</th>
                <th className="py-2.5 px-4 text-center">Vacancies</th>
                <th className="py-2.5 px-4 text-center">Assigned Candidates</th>
                <th className="py-2.5 px-4 text-center">Fill Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {requirementStats.map((req: any) => {
                const ratio = req.vacancies > 0 ? Math.round((req.assignedCount / req.vacancies) * 100) : 0;
                return (
                  <tr key={req.requirementId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{req.requirementId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{req.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                        {req.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{req.vacancies}</td>
                    <td className="py-3 px-4 text-center font-bold text-teal-600">{req.assignedCount}</td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${ratio >= 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {ratio}%
                      </span>
                    </td>
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

