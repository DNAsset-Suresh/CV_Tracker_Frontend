import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitPullRequest, Search, Eye, Filter } from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge, ClassificationBadge } from '../../components/common/Badge';

export const AdminAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getAssignments({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
      });

      if (data.success) {
        setAssignments(data.assignments || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [pagination.page, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Global Manager Candidate Allocations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Master audit of candidate distributions across Advocate, IT Development, and Field Executive managers.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            All Organizational Assignments
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{pagination.total} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Assignment ID</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Manager</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Assigned By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {assignments.map((a: any) => (
                <tr key={a._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{a.assignmentId}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {a.candidateId?.personalInformation?.fullName || 'Candidate'}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{a.requirementId?.title}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{a.managerId?.name}</td>
                  <td className="py-3 px-4">
                    <ClassificationBadge classification={a.managerId?.managerClassification} />
                  </td>
                  <td className="py-3 px-4 text-slate-600">{a.assignedBy?.name || 'HR'}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={a.assignmentStatus} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate(`/hr/candidates/${a.candidateId?._id}`)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

