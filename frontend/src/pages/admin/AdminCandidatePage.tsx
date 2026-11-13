import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Trash2, Download, Layers, ShieldCheck, CheckCircle } from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge, ClassificationBadge } from '../../components/common/Badge';

export const AdminCandidatePage: React.FC = () => {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await candidateService.getCandidates({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });

      if (data.success) {
        setCandidates(data.candidates || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [pagination.page, statusFilter]);

  const handleDeleteCandidate = async () => {
    if (!selectedCandidate) return;
    setActionLoading(true);
    try {
      await candidateService.deleteCandidate(selectedCandidate._id);
      setIsDeleteConfirmOpen(false);
      setSelectedCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Candidate Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global repository of candidates, verification status, audit logs, and departmental allocations.
          </p>
        </div>
        <button
          onClick={() => window.open(candidateService.exportCSVUrl(), '_blank')}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export All Candidates (CSV)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCandidates()}
            placeholder="Search candidate name, email, skills..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
        >
          <option value="">All Recruitment Statuses</option>
          <option value="Screened">Screened</option>
          <option value="Assigned">Assigned</option>
          <option value="Under Manager Review">Under Manager Review</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Interview Scheduled">Interview Scheduled</option>
          <option value="Selected">Selected</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Designation & Experience</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Primary Requirement</th>
                  <th className="py-3 px-4">Assigned Manager</th>
                  <th className="py-3 px-4">Recruitment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No candidates found.
                    </td>
                  </tr>
                ) : (
                  candidates.map((c) => {
                    const manager: any = c.assignedManagerId;
                    return (
                      <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/hr/candidates/${c._id}`)}
                            className="font-bold text-slate-900 hover:text-teal-600 block text-left"
                          >
                            {c.personalInformation?.fullName}
                          </button>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <span>{c.candidateId}</span>
                            {c.isVerifiedByHR && (
                              <span title="HR Verified">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {c.professionalInformation?.currentDesignation || 'Candidate'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {c.professionalInformation?.totalExperienceYears} yrs exp
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{c.personalInformation?.email}</div>
                          <div className="text-[11px] text-slate-400">{c.personalInformation?.phone}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {c.primaryRequirementId?.title || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {manager ? (
                            <div>
                              <div className="font-semibold text-slate-900">{manager.name}</div>
                              <ClassificationBadge classification={manager.managerClassification} />
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={c.recruitmentStatus} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/hr/candidates/${c._id}`)}
                              title="Inspect Full Profile"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCandidate(c);
                                setIsDeleteConfirmOpen(true);
                              }}
                              title="Delete Candidate Record Permanently"
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      </div>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteCandidate}
        title="Delete Candidate Permanently"
        message={`Are you sure you want to permanently delete "${selectedCandidate?.personalInformation?.fullName}" (${selectedCandidate?.candidateId}) from the database? All extracted resume information, assignments, and test data for this candidate will be permanently removed.`}
        isDanger={true}
        confirmLabel="Delete from Database"
        isLoading={actionLoading}
      />
    </div>
  );
};

