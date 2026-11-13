import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Eye,
  Filter,
  UserCheck,
  Calendar,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { userService } from '../../services/userService';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const AssignmentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getAssignments({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        managerId: managerFilter || undefined,
      });

      if (data.success) {
        setAssignments(data.assignments || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [pagination.page, statusFilter, managerFilter]);

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const res = await userService.getManagers();
        if (res.success) setManagers(res.managers || []);
      } catch (e) {
        // ignore
      }
    };
    loadManagers();
  }, []);

  // Filter assignments locally by search & date if needed
  const filteredAssignments = assignments.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      const candName = a.candidateId?.personalInformation?.fullName?.toLowerCase() || '';
      const reqTitle = a.requirementId?.title?.toLowerCase() || '';
      const asnId = a.assignmentId?.toLowerCase() || '';
      if (!candName.includes(q) && !reqTitle.includes(q) && !asnId.includes(q)) {
        return false;
      }
    }
    if (dateFilter) {
      const assignedDay = new Date(a.assignedAt).toISOString().split('T')[0];
      if (assignedDay !== dateFilter && a.interviewDate !== dateFilter) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Assignment History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete record of candidate allocations to departmental managers and status tracking.
          </p>
        </div>
        <button
          onClick={() => navigate('/hr/assignment')}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, req, ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="">All Assignment Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Selected">Selected</option>
            </select>
          </div>

          {/* Manager Filter */}
          <div>
            <select
              value={managerFilter}
              onChange={(e) => {
                setManagerFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="">All Department Managers</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.managerClassification})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>
        </div>

        {(search || statusFilter || managerFilter || dateFilter) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setManagerFilter('');
                setDateFilter('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Assignment Table (Desktop/Tablet) & Cards (Mobile) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={8} />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No assignment records found</p>
            <p className="text-[11px] text-slate-400">Try adjusting your filters or create a new assignment.</p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Assignment ID</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Job Requirement</th>
                    <th className="py-3 px-4">Assigned Manager</th>
                    <th className="py-3 px-4">Interview Date</th>
                    <th className="py-3 px-4">Interview Time</th>
                    <th className="py-3 px-4">Assignment Date</th>
                    <th className="py-3 px-4">Evaluation Status</th>
                    <th className="py-3 px-4">Recruitment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAssignments.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Assignment ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {a.assignmentId}
                      </td>

                      {/* Candidate Name (Profile Link) */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {a.candidateId ? (
                          <button
                            onClick={() => navigate(`/hr/candidates/${a.candidateId._id}`)}
                            className="text-teal-600 hover:underline text-left flex items-center gap-1"
                          >
                            <span>{a.candidateId?.personalInformation?.fullName || 'Candidate'}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                        ) : (
                          <span className="text-slate-400">Candidate Deleted</span>
                        )}
                      </td>

                      {/* Job Requirement */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {a.requirementId?.title || 'Open Req'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {a.requirementId?.department}
                        </span>
                      </td>

                      {/* Assigned Manager */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {a.managerId?.name || 'Manager'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {a.managerId?.managerClassification}
                        </span>
                      </td>

                      {/* Interview Date */}
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {a.interviewDate ? (
                          <span className="text-teal-700 font-semibold">{a.interviewDate}</span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* Interview Time */}
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {a.interviewTime ? (
                          <span className="text-slate-700">{a.interviewTime}</span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* Assignment Date */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(a.assignedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Manager Evaluation Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            a.assignmentStatus === 'Shortlisted' || a.assignmentStatus === 'Selected'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : a.assignmentStatus === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : a.assignmentStatus === 'Under Review'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {a.assignmentStatus}
                        </span>
                      </td>

                      {/* Final Recruitment Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-700">
                          {a.candidateId?.recruitmentStatus || 'Assigned'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredAssignments.map((a) => (
                <div key={a._id} className="p-4 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold block">
                        {a.assignmentId}
                      </span>
                      {a.candidateId ? (
                        <button
                          onClick={() => navigate(`/hr/candidates/${a.candidateId._id}`)}
                          className="font-bold text-slate-900 text-sm text-left hover:text-teal-600"
                        >
                          {a.candidateId?.personalInformation?.fullName || 'Candidate'}
                        </button>
                      ) : (
                        <span className="font-bold text-slate-400 text-sm">Candidate Deleted</span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.assignmentStatus === 'Shortlisted'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : a.assignmentStatus === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {a.assignmentStatus}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-slate-600 text-[11px]">
                    <div>
                      <span className="text-slate-400">Role:</span> {a.requirementId?.title}
                    </div>
                    <div>
                      <span className="text-slate-400">Manager:</span> {a.managerId?.name} (
                      {a.managerId?.managerClassification})
                    </div>
                    {a.interviewDate && (
                      <div className="text-teal-700 font-semibold">
                        Interview: {a.interviewDate} at {a.interviewTime || 'TBD'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Total Assignments: <span className="font-bold text-slate-700">{pagination.total}</span>
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
