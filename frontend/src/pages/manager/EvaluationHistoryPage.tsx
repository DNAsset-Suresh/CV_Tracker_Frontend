import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Calendar,
  Eye,
  X,
  FileText,
  User,
  Briefcase,
  Star,
  RefreshCw,
} from 'lucide-react';
import { managerService } from '../../services/managerService';

export const EvaluationHistoryPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await managerService.getEvaluations({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: search || undefined,
      });
      if (res.success) {
        setEvaluations(res.evaluations || []);
      }
    } catch (err) {
      console.error('Failed to load evaluation history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvaluations();
  };

  // Metrics
  const totalCount = evaluations.length;
  const shortlistedCount = evaluations.filter(
    (e) => e.evaluationStatus === 'Shortlist'
  ).length;
  const holdCount = evaluations.filter((e) => e.evaluationStatus === 'Hold').length;
  const rejectedCount = evaluations.filter(
    (e) => e.evaluationStatus === 'Reject'
  ).length;

  const getDecisionBadge = (status: string) => {
    switch (status) {
      case 'Shortlist':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Shortlisted
          </span>
        );
      case 'Reject':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'Hold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            On Hold
          </span>
        );
      case 'Recommend Next Round':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            Next Round
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status || 'Completed'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Evaluation History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Archived record of all candidate evaluations, assessment decisions, and interview feedback submitted to HR.
          </p>
        </div>
        <button
          onClick={fetchEvaluations}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          Refresh Records
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Evaluated
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800 uppercase tracking-wider">
              Shortlisted
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {shortlistedCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 uppercase tracking-wider">
              On Hold
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{holdCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 bg-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-800 uppercase tracking-wider">
              Rejected
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{rejectedCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate name, email, role, or comments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Decision:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="All">All Decisions</option>
              <option value="Shortlist">Shortlisted</option>
              <option value="Hold">On Hold</option>
              <option value="Reject">Rejected</option>
              <option value="Recommend Next Round">Recommend Next Round</option>
            </select>
          </div>
        </div>
      </div>

      {/* Evaluations Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs font-medium">Loading evaluation history...</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">No evaluations found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {statusFilter !== 'All' || search
                ? 'Try adjusting your filters or search keywords.'
                : 'Candidates evaluated under "My Assigned Candidates" will appear here automatically.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Candidate</th>
                    <th className="py-3.5 px-4">Job Requirement</th>
                    <th className="py-3.5 px-4">Interview Schedule</th>
                    <th className="py-3.5 px-4">Manager Decision</th>
                    <th className="py-3.5 px-4">Overall Score</th>
                    <th className="py-3.5 px-4">Evaluation Date</th>
                    <th className="py-3.5 px-4">Comments</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {evaluations.map((ev: any) => {
                    const candidate = ev.candidateId;
                    const assignment = ev.assignmentId;
                    const req = assignment?.requirementId;
                    const candidateName =
                      candidate?.personalInformation?.fullName || 'Unnamed Candidate';
                    const candidateEmail =
                      candidate?.personalInformation?.email || 'No email';
                    const reqTitle = req?.title || 'General Position';
                    const reqDept = req?.department || 'Operations';
                    const interviewDate = assignment?.interviewDate;
                    const interviewTime = assignment?.interviewTime;
                    const overallScore = ev.ratings?.overall;

                    return (
                      <tr key={ev._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 text-sm">
                            {candidateName}
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono">
                            {candidate?.candidateId || 'N/A'} • {candidateEmail}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{reqTitle}</div>
                          <div className="text-slate-400 text-[11px]">{reqDept}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {interviewDate ? (
                            <div>
                              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                {new Date(interviewDate).toLocaleDateString()}
                              </div>
                              {interviewTime && (
                                <div className="text-slate-400 text-[11px]">
                                  {interviewTime}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not Scheduled</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getDecisionBadge(ev.evaluationStatus)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {overallScore ? (
                            <div className="flex items-center gap-1 text-amber-600 font-semibold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{overallScore}/5</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          {new Date(ev.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="truncate text-slate-600" title={ev.comments}>
                            {ev.comments}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedEvaluation(ev)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {evaluations.map((ev: any) => {
                const candidate = ev.candidateId;
                const assignment = ev.assignmentId;
                const req = assignment?.requirementId;
                const candidateName =
                  candidate?.personalInformation?.fullName || 'Unnamed Candidate';
                const reqTitle = req?.title || 'General Position';
                const interviewDate = assignment?.interviewDate;

                return (
                  <div key={ev._id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {candidateName}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {reqTitle} • {req?.department || 'Operations'}
                        </p>
                      </div>
                      {getDecisionBadge(ev.evaluationStatus)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Interview</span>
                        <span className="font-medium text-slate-800">
                          {interviewDate
                            ? new Date(interviewDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Evaluated On</span>
                        <span className="font-medium text-slate-800">
                          {new Date(ev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50/50 p-2 rounded border border-slate-100">
                      "{ev.comments}"
                    </p>

                    <button
                      onClick={() => setSelectedEvaluation(ev)}
                      className="w-full py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-blue-100 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Full Assessment
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Full Evaluation Details Modal */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8 border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Manager Evaluation Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
              {/* Candidate & Job Summary Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-base">
                      {selectedEvaluation.candidateId?.personalInformation?.fullName ||
                        'Candidate'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedEvaluation.candidateId?.personalInformation?.email || 'N/A'} •{' '}
                    {selectedEvaluation.candidateId?.personalInformation?.phone || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    Target Role:{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedEvaluation.assignmentId?.requirementId?.title ||
                        'General Role'}
                    </span>{' '}
                    ({selectedEvaluation.assignmentId?.requirementId?.department || 'Dept'})
                  </p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-[11px] text-slate-400 font-medium">Decision</span>
                  <div className="mt-1">
                    {getDecisionBadge(selectedEvaluation.evaluationStatus)}
                  </div>
                </div>
              </div>

              {/* Interview Timing (if present) */}
              {(selectedEvaluation.assignmentId?.interviewDate ||
                selectedEvaluation.assignmentId?.interviewTime) && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Planned Interview Schedule
                  </h4>
                  <p className="text-xs text-blue-800">
                    Date:{' '}
                    <span className="font-semibold">
                      {selectedEvaluation.assignmentId?.interviewDate
                        ? new Date(
                            selectedEvaluation.assignmentId.interviewDate
                          ).toLocaleDateString()
                        : 'Not specified'}
                    </span>{' '}
                    • Time:{' '}
                    <span className="font-semibold">
                      {selectedEvaluation.assignmentId?.interviewTime || 'Not specified'}
                    </span>
                  </p>
                </div>
              )}

              {/* Rating Breakdown */}
              {selectedEvaluation.ratings && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Evaluation Scores
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Technical Skills
                      </span>
                      <span className="text-lg font-bold text-slate-800">
                        {selectedEvaluation.ratings.technicalSkills || '—'}/5
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Communication
                      </span>
                      <span className="text-lg font-bold text-slate-800">
                        {selectedEvaluation.ratings.communication || '—'}/5
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Experience Fit
                      </span>
                      <span className="text-lg font-bold text-slate-800">
                        {selectedEvaluation.ratings.relevantExperience || '—'}/5
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Cultural Fit
                      </span>
                      <span className="text-lg font-bold text-slate-800">
                        {selectedEvaluation.ratings.culturalFit || '—'}/5
                      </span>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-center col-span-2 sm:col-span-2">
                      <span className="text-[11px] text-amber-700 block font-semibold">
                        Overall Assessment Score
                      </span>
                      <span className="text-xl font-black text-amber-800">
                        {selectedEvaluation.ratings.overall || '—'} / 5
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses (if any) */}
              {((selectedEvaluation.strengths && selectedEvaluation.strengths.length > 0) ||
                (selectedEvaluation.weaknesses && selectedEvaluation.weaknesses.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedEvaluation.strengths && selectedEvaluation.strengths.length > 0 && (
                    <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3.5">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-2">
                        Strengths Observed
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEvaluation.strengths.map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvaluation.weaknesses && selectedEvaluation.weaknesses.length > 0 && (
                    <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-3.5">
                      <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-2">
                        Areas of Concern
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEvaluation.weaknesses.map((w: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-xs font-medium"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedEvaluation.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wider block mb-1">
                    Primary Rejection Reason
                  </span>
                  <p className="text-xs text-rose-800 font-medium">
                    {selectedEvaluation.rejectionReason}
                  </p>
                </div>
              )}

              {/* Detailed Comments */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Manager Feedback Comments
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedEvaluation.comments || 'No written comments provided.'}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-right text-[11px] text-slate-400">
                Evaluation Submitted:{' '}
                {new Date(selectedEvaluation.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

