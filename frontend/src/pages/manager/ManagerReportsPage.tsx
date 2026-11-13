import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { StatsCard } from '../../components/common/StatsCard';

export const ManagerReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await reportService.getManagerReports();
        if (res.success) setData(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Manager Recruitment Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Candidate review throughput, shortlisting metrics, and selection conversion rates.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard
          title="Assigned Candidates"
          value={metrics.total || 0}
          subtitle="Portfolio allocation"
          icon={BarChart3}
          iconColor="text-teal-600 bg-teal-50"
        />
        <StatsCard
          title="Shortlist Rate"
          value={`${metrics.shortlistRate || 0}%`}
          subtitle={`${metrics.shortlisted || 0} candidates shortlisted`}
          icon={TrendingUp}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <StatsCard
          title="Selection Rate"
          value={`${metrics.selectionRate || 0}%`}
          subtitle={`${metrics.selected || 0} offers extended`}
          icon={CheckCircle}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <StatsCard
          title="Pending Reviews"
          value={metrics.pending || 0}
          subtitle="Awaiting evaluation"
          icon={Clock}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>
    </div>
  );
};

