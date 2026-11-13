import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
  Calendar,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { managerService } from '../../services/managerService';
import { useAuth } from '../../context/AuthContext';
import { StatsCard } from '../../components/common/StatsCard';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge, ClassificationBadge } from '../../components/common/Badge';

export const ManagerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await managerService.getDashboard();
        if (res.success) setData(res);
      } catch (err) {
        console.error('Failed to load manager dashboard:', err);
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

  const metrics = data?.metrics || {};
  const recentAssignments = data?.recentAssignments || [];
  const upcomingInterviews = data?.upcomingInterviews || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title & Classification Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Departmental Manager Workspace</h1>
            <ClassificationBadge classification={user?.managerClassification} />
          </div>
          <p className="text-xs text-slate-500">
            Assigned candidate screening, interview scheduling, and recruitment evaluation.
          </p>
        </div>
        <button
          onClick={() => navigate('/manager/candidates')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          <Users className="w-4 h-4" />
          Review Assigned Candidates
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Assigned Candidates"
          value={metrics.totalAssigned || 0}
          subtitle="Allocated by HR recruitment team"
          icon={Users}
          iconColor="text-teal-600 bg-teal-50"
        />
        <StatsCard
          title="Pending My Review"
          value={metrics.pendingReviews || 0}
          subtitle="Awaiting evaluation & feedback"
          icon={Clock}
          iconColor="text-amber-600 bg-amber-50"
        />
        <StatsCard
          title="Shortlisted"
          value={metrics.shortlisted || 0}
          subtitle="Recommended for next rounds"
          icon={UserCheck}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <StatsCard
          title="Selected for Offer"
          value={metrics.selected || 0}
          subtitle="Final hiring confirmed"
          icon={CheckCircle}
          iconColor="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Grid: Upcoming Interviews & Recent Assigned Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assignments Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Assigned Candidates Awaiting Action
            </h3>
            <button
              onClick={() => navigate('/manager/candidates')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Candidate</th>
                  <th className="py-2.5 px-4">Requirement</th>
                  <th className="py-2.5 px-4">Assigned Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No candidates currently assigned to your account.
                    </td>
                  </tr>
                ) : (
                  recentAssignments.map((a: any) => (
                    <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {a.candidateId?.personalInformation?.fullName || 'Candidate'}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {a.candidateId?.candidateId}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {a.requirementId?.title}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(a.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={a.assignmentStatus} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/manager/candidates`)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Interviews Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Upcoming Interviews</span>
              </h3>
              <span className="text-xs font-bold text-teal-600">
                {upcomingInterviews.length} Scheduled
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {upcomingInterviews.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No upcoming interviews scheduled.
                </div>
              ) : (
                upcomingInterviews.map((int: any) => (
                  <div key={int._id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">
                        {int.candidateId?.personalInformation?.fullName}
                      </span>
                      <span className="text-[11px] font-semibold text-teal-600">
                        {int.interviewType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(int.interviewDate).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {int.meetingLink && (
                      <a
                        href={int.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline pt-0.5"
                      >
                        Join Meeting Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/manager/interviews')}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold text-center border border-slate-200"
          >
            Manage Interview Calendar →
          </button>
        </div>
      </div>
    </div>
  );
};

