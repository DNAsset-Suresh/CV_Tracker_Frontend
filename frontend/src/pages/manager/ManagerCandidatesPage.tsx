import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  Briefcase,
  User,
  GraduationCap,
  Sparkles,
  FileText,
  AlertCircle,
  Copy,
  Check,
  Send,
  Building,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { managerService } from '../../services/managerService';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const ManagerCandidatesPage: React.FC = () => {
  const navigate = useNavigate();

  const [candidateList, setCandidateList] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Evaluation & Detail Modal State
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showResumeText, setShowResumeText] = useState(false);

  // Evaluation form state
  const [evalDecision, setEvalDecision] = useState<'Shortlist' | 'Reject' | 'Hold' | 'Recommend Next Round'>('Shortlist');
  const [evalComments, setEvalComments] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [suitabilityRemarks, setSuitabilityRemarks] = useState('');
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);
  const [evalError, setEvalError] = useState('');

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await managerService.getAssignedCandidates({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        search: search || undefined,
      });

      if (res.success) {
        setCandidateList(res.candidates || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load manager candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [pagination.page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCandidates();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Assigned Candidates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review candidate qualifications, planned interview times, and record your evaluation decision for HR.
          </p>
        </div>
        <button
          onClick={() => navigate('/manager/evaluation-history')}
          className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
        >
          <span>View Evaluation History</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assigned candidate or role..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="">All Assignment Statuses</option>
              <option value="Assigned">Assigned (New)</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="Hold">On Hold</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Candidates Table (Desktop/Tablet) & Cards (Mobile) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={8} />
          </div>
        ) : candidateList.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No candidates assigned</p>
            <p className="text-[11px] text-slate-400">
              When HR assigns candidates to your portfolio, they will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Job Requirement</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Primary Skills</th>
                    <th className="py-3 px-4">Interview Date</th>
                    <th className="py-3 px-4">Interview Time</th>
                    <th className="py-3 px-4">Assignment Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {candidateList.map((item) => {
                    const c = item.candidate;
                    const asn = item.assignment;
                    const req = item.requirement;
                    const skills = [
                      ...(c?.skills?.technicalSkills || []),
                      ...(c?.skills?.programmingLanguages || []),
                      ...(c?.skills?.domainSpecific || []),
                    ];

                    return (
                      <tr key={asn._id} className="hover:bg-slate-50/60 transition-colors">
                        {/* 1. Candidate Name */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <span>{c?.personalInformation?.fullName || 'Candidate'}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {c?.candidateId}
                          </span>
                        </td>

                        {/* 2. Job Requirement */}
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <span>{req?.title || 'Open Requirement'}</span>
                        </td>

                        {/* 3. Experience */}
                        <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                          {c?.professionalInformation?.totalExperienceYears
                            ? `${c.professionalInformation.totalExperienceYears} yrs`
                            : '0 yrs'}
                        </td>

                        {/* 4. Primary Skills */}
                        <td className="py-3 px-4 text-slate-600 max-w-[170px] truncate" title={skills.join(', ')}>
                          {skills.slice(0, 3).join(', ') || 'N/A'}
                        </td>

                        {/* 5. Interview Date */}
                        <td className="py-3 px-4 font-semibold text-teal-700 whitespace-nowrap">
                          {asn.interviewDate || 'TBD'}
                        </td>

                        {/* 6. Interview Time */}
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {asn.interviewTime || 'TBD'}
                        </td>

                        {/* 7. Assignment Date */}
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(asn.assignedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* 8. Evaluation Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${asn.assignmentStatus === 'Shortlisted'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : asn.assignmentStatus === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : asn.assignmentStatus === 'Under Review'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-sky-50 text-sky-700 border border-sky-200'
                              }`}
                          >
                            {asn.assignmentStatus}
                          </span>
                        </td>

                        {/* 9. Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/manager/candidates/${c._id}/evaluate`)}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>Evaluate</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {candidateList.map((item) => {
                const c = item.candidate;
                const asn = item.assignment;
                const req = item.requirement;
                return (
                  <div key={asn._id} className="p-4 space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {c?.personalInformation?.fullName}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {req?.title} • {c?.professionalInformation?.totalExperienceYears || 0} yrs exp
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        {asn.assignmentStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div>
                        <span className="text-slate-400">Interview:</span>{' '}
                        <span className="font-semibold text-teal-700">
                          {asn.interviewDate ? `${asn.interviewDate} at ${asn.interviewTime || ''}` : 'Schedule TBD'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => navigate(`/manager/candidates/${c._id}/evaluate`)}
                        className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold"
                      >
                        Review & Evaluate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Assigned: <span className="font-bold text-slate-700">{pagination.total}</span>
              </div>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
