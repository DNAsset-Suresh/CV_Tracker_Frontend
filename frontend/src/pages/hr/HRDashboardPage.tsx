import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  CheckSquare,
  ArrowRight,
  Calendar,
  Layers,
  ChevronRight,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

export const HRDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await reportService.getHRReports();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load HR dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const recentCandidates = data?.recentCandidates || [];
  const recentAssignments = data?.recentAssignments || [];
  const recentEvaluations = data?.recentEvaluations || [];
  const statusBreakdown = data?.statusBreakdown || {};

  const summaryCards = [
    {
      title: 'Total Candidates',
      value: metrics.totalCandidates ?? 0,
      description: 'Total profiles registered',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Successfully Processed',
      value: metrics.successfullyProcessed ?? 0,
      description: 'Extracted and stored',
      icon: CheckCircle2,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      title: 'Pending HR Review',
      value: metrics.pendingHRReview ?? 0,
      description: 'Awaiting suitability check',
      icon: AlertCircle,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Ready for Assignment',
      value: metrics.readyForAssignment ?? 0,
      description: 'HR evaluated as Suitable',
      icon: CheckSquare,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Assigned Candidates',
      value: metrics.assignedCandidates ?? 0,
      description: 'Dispatched to managers',
      icon: Send,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'Manager Evaluation Pending',
      value: metrics.managerEvaluationPending ?? 0,
      description: 'Awaiting manager feedback',
      icon: Clock,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            HR Recruitment Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview of intake, candidate review status, and departmental manager evaluations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/hr/candidates')}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Candidate Database</span>
          </button>
          <button
            onClick={() => navigate('/hr/assignment')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* EXACT 6 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between transition-all hover:border-slate-300"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{card.description}</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* LOWER 4 SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Recently Uploaded Candidates */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recently Uploaded Candidates</h2>
              <p className="text-[11px] text-slate-400">Newly parsed profiles ready for review</p>
            </div>
            <button
              onClick={() => navigate('/hr/candidates')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentCandidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No candidates uploaded yet</div>
            ) : (
              recentCandidates.map((c: any) => (
                <div
                  key={c._id}
                  onClick={() => navigate(`/hr/candidates/${c._id}`)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {c.personalInformation?.fullName || 'Unnamed Candidate'}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{c.professionalInformation?.totalExperienceYears || 0} yrs exp</span>
                      <span>•</span>
                      <span>{c.personalInformation?.currentLocation || 'Location N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.hrReviewStatus === 'Suitable'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.hrReviewStatus === 'Not Suitable'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.hrReviewStatus || 'Pending Review'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Recently Assigned Candidates */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recently Assigned Candidates</h2>
              <p className="text-[11px] text-slate-400">Active allocations sent to managers</p>
            </div>
            <button
              onClick={() => navigate('/hr/assignment-history')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAssignments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No active assignments yet</div>
            ) : (
              recentAssignments.map((a: any) => (
                <div key={a._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {a.candidateId?.personalInformation?.fullName || 'Candidate'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Role: <span className="font-semibold">{a.requirementId?.title || 'Open Req'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Manager: {a.managerId?.name}</span>
                      {a.interviewDate && (
                        <>
                          <span>•</span>
                          <span className="text-teal-600 font-semibold">
                            Interview: {a.interviewDate} {a.interviewTime || ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    {a.assignmentStatus}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Recent Manager Evaluation Updates */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Manager Evaluations</h2>
              <p className="text-[11px] text-slate-400">Feedback submitted by departmental managers</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentEvaluations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No evaluations submitted yet</div>
            ) : (
              recentEvaluations.map((fb: any) => (
                <div key={fb._id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {fb.candidateId?.personalInformation?.fullName || 'Candidate'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        fb.evaluationStatus === 'Shortlist'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : fb.evaluationStatus === 'Reject'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {fb.evaluationStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                    "{fb.comments}"
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Evaluated by {fb.managerId?.name} ({fb.managerId?.managerClassification})
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Simple Recruitment Status Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recruitment Status Overview</h2>
              <p className="text-[11px] text-slate-400">Clean candidate pipeline distribution</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { label: 'New / Uploaded', count: statusBreakdown.new || 0, color: 'bg-slate-400' },
              { label: 'Screened & Ready', count: statusBreakdown.screened || 0, color: 'bg-teal-500' },
              { label: 'Assigned to Manager', count: statusBreakdown.assigned || 0, color: 'bg-sky-500' },
              { label: 'Under Review', count: statusBreakdown.underReview || 0, color: 'bg-indigo-500' },
              { label: 'Shortlisted', count: statusBreakdown.shortlisted || 0, color: 'bg-emerald-500' },
              { label: 'Selected', count: statusBreakdown.selected || 0, color: 'bg-teal-700' },
              { label: 'Rejected', count: statusBreakdown.rejected || 0, color: 'bg-rose-500' },
            ].map((st, i) => {
              const total = metrics.totalCandidates || 1;
              const pct = Math.round((st.count / total) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{st.label}</span>
                    <span className="text-slate-500">
                      {st.count} <span className="text-[10px] font-normal text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${st.color} transition-all duration-500`}
                      style={{ width: `${Math.max(st.count > 0 ? 5 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
