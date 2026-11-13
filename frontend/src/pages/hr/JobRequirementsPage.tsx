import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Users,
  Edit,
  Clock,
  Layers,
} from 'lucide-react';
import { requirementService } from '../../services/requirementService';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge, ClassificationBadge } from '../../components/common/Badge';

export const JobRequirementsPage: React.FC = () => {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    department: 'IT Development',
    jobDescription: '',
    requiredSkills: '',
    preferredSkills: '',
    minExperience: 2,
    maxExperience: 5,
    relevantExperience: 2,
    qualification: 'Bachelor Degree',
    preferredLocation: 'Chennai',
    vacancies: 2,
    employmentType: 'Full-time',
    status: 'Active',
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchRequirements = async () => {
    setIsLoading(true);
    try {
      const data = await requirementService.getRequirements({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        department: deptFilter || undefined,
        status: statusFilter || undefined,
      });

      if (data.success) {
        setRequirements(data.requirements || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to load requirements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [pagination.page, deptFilter, statusFilter]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedReqId(null);
    setForm({
      title: '',
      department: 'IT Development',
      jobDescription: '',
      requiredSkills: '',
      preferredSkills: '',
      minExperience: 2,
      maxExperience: 5,
      relevantExperience: 2,
      qualification: 'Bachelor Degree',
      preferredLocation: 'Chennai',
      vacancies: 2,
      employmentType: 'Full-time',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (req: any) => {
    setIsEditing(true);
    setSelectedReqId(req._id);
    setForm({
      title: req.title,
      department: req.department,
      jobDescription: req.jobDescription,
      requiredSkills: (req.requiredSkills || []).join(', '),
      preferredSkills: (req.preferredSkills || []).join(', '),
      minExperience: req.minExperience || 0,
      maxExperience: req.maxExperience || 5,
      relevantExperience: req.relevantExperience || 0,
      qualification: req.qualification || 'Bachelor Degree',
      preferredLocation: req.preferredLocation || 'Chennai',
      vacancies: req.vacancies || 1,
      employmentType: req.employmentType || 'Full-time',
      status: req.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        ...form,
        requiredSkills: form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        preferredSkills: form.preferredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (isEditing && selectedReqId) {
        await requirementService.updateRequirement(selectedReqId, payload);
      } else {
        await requirementService.createRequirement(payload);
      }

      setIsModalOpen(false);
      fetchRequirements();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save requirement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Closed' : 'Active';
    try {
      await requirementService.updateStatus(id, nextStatus);
      fetchRequirements();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Job Requirement Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Departmental job profiles across IT Development, Advocate, and Field Executive.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Job Requirement
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
            onKeyDown={(e) => e.key === 'Enter' && fetchRequirements()}
            placeholder="Search title, skills, requirement ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Departments</option>
            <option value="IT Development">IT Development</option>
            <option value="Advocate">Advocate</option>
            <option value="Field Executive">Field Executive</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Requirements Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Experience Range</th>
                  <th className="py-3 px-4">Required Skills</th>
                  <th className="py-3 px-4 text-center">Vacancies</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requirements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No job requirements found.
                    </td>
                  </tr>
                ) : (
                  requirements.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{req.title}</div>
                        <div className="text-[11px] font-mono text-slate-400">{req.requirementId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {req.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {req.minExperience} – {req.maxExperience} yrs
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {(req.requiredSkills || []).slice(0, 3).map((s: string) => (
                            <span key={s} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {req.vacancies}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(req)}
                            title="Edit Requirement"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(req._id, req.status)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                              req.status === 'Active'
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {req.status === 'Active' ? 'Close' : 'Reopen'}
                          </button>
                        </div>
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

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Job Requirement' : 'Create Job Requirement'}
        subtitle="Department classification must align with manager roles"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Senior React Developer"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Department Classification *
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold"
              >
                <option value="IT Development">IT Development</option>
                <option value="Advocate">Advocate</option>
                <option value="Field Executive">Field Executive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Job Description *
            </label>
            <textarea
              required
              rows={3}
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
              placeholder="Detailed description of responsibilities and core deliverables..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Required Skills (Comma separated) *
              </label>
              <input
                type="text"
                required
                value={form.requiredSkills}
                onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                placeholder="React, JavaScript, Node.js"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Preferred Skills (Comma separated)
              </label>
              <input
                type="text"
                value={form.preferredSkills}
                onChange={(e) => setForm({ ...form, preferredSkills: e.target.value })}
                placeholder="Docker, AWS, Tailwind"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Min Exp (Yrs)
              </label>
              <input
                type="number"
                min="0"
                value={form.minExperience}
                onChange={(e) => setForm({ ...form, minExperience: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Max Exp (Yrs)
              </label>
              <input
                type="number"
                min="0"
                value={form.maxExperience}
                onChange={(e) => setForm({ ...form, maxExperience: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Vacancies
              </label>
              <input
                type="number"
                min="1"
                value={form.vacancies}
                onChange={(e) => setForm({ ...form, vacancies: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Preferred Location
              </label>
              <input
                type="text"
                value={form.preferredLocation}
                onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })}
                placeholder="e.g. Chennai / Hybrid"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Education Qualification
              </label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                placeholder="e.g. B.Tech in Computer Science / LL.B"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update Requirement' : 'Create Requirement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

