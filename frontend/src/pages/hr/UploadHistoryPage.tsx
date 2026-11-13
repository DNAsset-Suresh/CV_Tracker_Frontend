import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, RotateCcw, Search, Download, Clock, CheckCircle } from 'lucide-react';
import { resumeService } from '../../services/resumeService';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/Badge';

export const UploadHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const data = await resumeService.getResumes({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      if (data.success) {
        setResumes(data.resumes || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [pagination.page, statusFilter]);

  const handleRetry = async (id: string) => {
    try {
      await resumeService.retryResume(id);
      fetchResumes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Retry failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Resume Upload History & Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit history of single & bulk uploaded documents, extraction status, and error logs.
          </p>
        </div>
        <button
          onClick={() => navigate('/hr/upload')}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          + Upload More Resumes
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
            onKeyDown={(e) => e.key === 'Enter' && fetchResumes()}
            placeholder="Search original file name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="Extracted">Extracted</option>
          <option value="Processing">Processing</option>
          <option value="Queued">Queued</option>
          <option value="Failed">Failed</option>
          <option value="Duplicate">Duplicate</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Extracted Profile</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {resumes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No resume upload history found.
                    </td>
                  </tr>
                ) : (
                  resumes.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 truncate max-w-xs">
                        {r.originalFileName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.uploadedBy?.name || 'HR Staff'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {r.uploadBatchId || 'Single'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.processingStatus} />
                      </td>
                      <td className="py-3 px-4">
                        {r.candidateId ? (
                          <button
                            onClick={() => navigate(`/hr/candidates/${r.candidateId._id || r.candidateId}`)}
                            className="text-teal-600 hover:text-teal-800 font-bold"
                          >
                            {r.candidateId.personalInformation?.fullName || 'View Profile'}
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.processingStatus === 'Failed' && (
                          <button
                            onClick={() => handleRetry(r._id)}
                            className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 font-semibold"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
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
    </div>
  );
};

