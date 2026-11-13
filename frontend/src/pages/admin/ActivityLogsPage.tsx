import React, { useEffect, useState } from 'react';
import { History, Search, Shield, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/activity-logs', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          action: actionFilter || undefined,
          entityType: entityFilter || undefined,
        },
      });
      if (res.data.success) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, actionFilter, entityFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Application Activity Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident system logs of user actions, candidate assignments, modifications, and authentications.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
        >
          <option value="">All Actions</option>
          <option value="USER_CREATED">USER_CREATED</option>
          <option value="USER_LOGIN">USER_LOGIN</option>
          <option value="CANDIDATE_ASSIGNED_TO_MANAGER">CANDIDATE_ASSIGNED_TO_MANAGER</option>
          <option value="CANDIDATE_RECORD_EDITED">CANDIDATE_RECORD_EDITED</option>
          <option value="MANAGER_FEEDBACK_SUBMITTED">MANAGER_FEEDBACK_SUBMITTED</option>
          <option value="INTERVIEW_SCHEDULED">INTERVIEW_SCHEDULED</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
        >
          <option value="">All Entities</option>
          <option value="User">User</option>
          <option value="Candidate">Candidate</option>
          <option value="Resume">Resume</option>
          <option value="Requirement">Requirement</option>
          <option value="Assignment">Assignment</option>
          <option value="Feedback">Feedback</option>
          <option value="Interview">Interview</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                      No activity logs match the selected filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">
                        {log.userId?.name || 'System / Service'}
                        <div className="text-[10px] text-slate-400 font-mono">{log.userId?.role || ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-slate-700">
                        {log.entityType} ({log.entityId ? log.entityId.slice(-6) : '—'})
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-500">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
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

