import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  UploadCloud,
  Eye,
  Edit2,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  FileText,
  FolderUp,
  RefreshCw,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { resumeService } from '../../services/resumeService';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const CandidateDatabasePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [hrReviewStatus, setHrReviewStatus] = useState('');
  const [minExp, setMinExp] = useState('');
  const [maxExp, setMaxExp] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk' | 'folder'>('single');
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Quick Edit Modal State
  const [editingCandidate, setEditingCandidate] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await candidateService.getCandidates({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        hrReviewStatus: hrReviewStatus || undefined,
        minExp: minExp || undefined,
        maxExp: maxExp || undefined,
        location: locationFilter || undefined,
      });

      if (data.success) {
        setCandidates(data.candidates || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [pagination.page, hrReviewStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCandidates();
  };

  const resetFilters = () => {
    setSearch('');
    setHrReviewStatus('');
    setMinExp('');
    setMaxExp('');
    setLocationFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Upload Handlers
  const handleSingleUpload = async () => {
    if (!singleFile) return;
    setIsUploading(true);
    setUploadProgressMsg('Uploading resume document...');
    setUploadError(null);
    try {
      const res = await resumeService.uploadSingle(singleFile);
      if (res.success && res.resume?._id) {
        setUploadProgressMsg('Resume uploaded! Extracting profile details via document engine...');
        const resumeId = res.resume._id;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds

        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await resumeService.getResumeStatus(resumeId);
            const status = statusRes.resume?.processingStatus;
            if (status === 'Extracted' || status === 'Failed' || attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setUploadProgressMsg(status === 'Extracted' ? 'Candidate profile extracted successfully!' : 'Extraction completed.');
              setTimeout(() => {
                setIsUploadModalOpen(false);
                setSingleFile(null);
                setUploadProgressMsg(null);
                setIsUploading(false);
                fetchCandidates();
              }, 800);
            }
          } catch (e) {
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setIsUploadModalOpen(false);
              setSingleFile(null);
              setUploadProgressMsg(null);
              setIsUploading(false);
              fetchCandidates();
            }
          }
        }, 1000);
      } else {
        setIsUploadModalOpen(false);
        setSingleFile(null);
        setIsUploading(false);
        fetchCandidates();
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Failed to upload resume');
      setIsUploading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) return;
    setIsUploading(true);
    const totalFiles = bulkFiles.length;
    setUploadProgressMsg(`Uploading ${totalFiles} resumes to server...`);
    setUploadError(null);
    try {
      const res = await resumeService.uploadBulk(bulkFiles);
      if (res.success && res.batchId) {
        setUploadProgressMsg(`Uploaded ${totalFiles} resumes. Ingesting profiles (0/${totalFiles})...`);
        const batchId = res.batchId;
        let attempts = 0;
        const maxAttempts = 90; // up to 90s for large batches

        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await resumeService.getBatchStatus(batchId);
            if (statusRes.success && statusRes.summary) {
              const { extracted, failed, duplicate, isCompleted } = statusRes.summary;
              const completedCount = extracted + failed + (duplicate || 0);
              setUploadProgressMsg(`Extracting resume profiles: ${completedCount} / ${totalFiles} completed...`);

              if (isCompleted || completedCount >= totalFiles || attempts >= maxAttempts) {
                clearInterval(pollInterval);
                setUploadProgressMsg(`All ${totalFiles} resumes processed (${extracted} extracted, ${failed} failed). Refreshing candidates...`);
                setTimeout(() => {
                  setIsUploadModalOpen(false);
                  setBulkFiles([]);
                  setUploadProgressMsg(null);
                  setIsUploading(false);
                  fetchCandidates();
                }, 1000);
              }
            }
          } catch (pollErr) {
            console.error('Batch polling error:', pollErr);
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setIsUploadModalOpen(false);
              setBulkFiles([]);
              setUploadProgressMsg(null);
              setIsUploading(false);
              fetchCandidates();
            }
          }
        }, 1000);
      } else {
        setUploadProgressMsg(`Resumes uploaded successfully.`);
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setBulkFiles([]);
          setUploadProgressMsg(null);
          setIsUploading(false);
          fetchCandidates();
        }, 1200);
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Failed to upload bulk resumes');
      setIsUploading(false);
    }
  };

  // Quick Edit Handlers
  const openEditModal = (candidate: any) => {
    setEditingCandidate(candidate);
    setEditFormData({
      fullName: candidate.personalInformation?.fullName || '',
      email: candidate.personalInformation?.email || '',
      phone: candidate.personalInformation?.phone || '',
      currentLocation: candidate.personalInformation?.currentLocation || '',
      totalExperienceYears: candidate.professionalInformation?.totalExperienceYears || 0,
      degree: candidate.education?.[0]?.degree || '',
      hrReviewStatus: candidate.hrReviewStatus || 'Pending',
      hrEvaluationNotes: candidate.hrEvaluationNotes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;
    setIsSavingEdit(true);
    try {
      const payload = {
        personalInformation: {
          fullName: editFormData.fullName,
          email: editFormData.email,
          phone: editFormData.phone,
          currentLocation: editFormData.currentLocation,
        },
        professionalInformation: {
          totalExperienceYears: Number(editFormData.totalExperienceYears) || 0,
        },
        education: [
          {
            degree: editFormData.degree,
            highestQualification: editFormData.degree,
            institution: editingCandidate.education?.[0]?.institution || 'University',
          },
        ],
        hrReviewStatus: editFormData.hrReviewStatus,
        hrEvaluationNotes: editFormData.hrEvaluationNotes,
      };

      const res = await candidateService.updateCandidate(editingCandidate._id, payload);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchCandidates();
      }
    } catch (err) {
      console.error('Failed to update candidate:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Candidate Database
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, filter, evaluate suitability, and select candidates for departmental assignment.
          </p>
        </div>
        <button
          onClick={() => {
            setIsUploadModalOpen(true);
            setUploadError(null);
            setUploadProgressMsg(null);
          }}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Resumes</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by candidate name, email, or skills..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={hrReviewStatus}
              onChange={(e) => {
                setHrReviewStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="">All Review Statuses</option>
              <option value="Suitable">Suitable (Ready to Assign)</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Not Suitable">Not Suitable</option>
              <option value="Pending">Pending Review</option>
            </select>

            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isFilterOpen || minExp || maxExp || locationFilter
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
            >
              Search
            </button>
          </div>
        </form>

        {/* Collapsible Additional Filters */}
        {isFilterOpen && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Min Experience (Yrs)</label>
              <input
                type="number"
                min="0"
                value={minExp}
                onChange={(e) => setMinExp(e.target.value)}
                placeholder="e.g. 2"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Max Experience (Yrs)</label>
              <input
                type="number"
                min="0"
                value={maxExp}
                onChange={(e) => setMaxExp(e.target.value)}
                placeholder="e.g. 8"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Location</label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="e.g. Chennai, Bangalore"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            {(minExp || maxExp || locationFilter || hrReviewStatus || search) && (
              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SIMPLIFIED CANDIDATE TABLE (Desktop/Tablet) & CARDS (Mobile) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No candidates match your criteria</h3>
            <p className="text-xs text-slate-400">
              Try adjusting your search terms or upload new resumes to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Primary Skills</th>
                    <th className="py-3 px-4">Qualification</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">HR Review</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((c) => {
                    const skills = [
                      ...(c.skills?.technicalSkills || []),
                      ...(c.skills?.programmingLanguages || []),
                      ...(c.skills?.domainSpecific || []),
                    ];
                    const skillsDisplay = skills.slice(0, 3).join(', ');

                    return (
                      <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                        {/* 1. Candidate Name */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <button
                            onClick={() => navigate(`/hr/candidates/${c._id}`)}
                            className="hover:text-teal-600 hover:underline text-left block"
                          >
                            {c.personalInformation?.fullName || 'Not Available'}
                          </button>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {c.candidateId}
                          </span>
                        </td>

                        {/* 2. Email */}
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                          {c.personalInformation?.email || 'N/A'}
                        </td>

                        {/* 3. Phone */}
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {c.personalInformation?.phone || 'N/A'}
                        </td>

                        {/* 4. Experience */}
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {c.professionalInformation?.totalExperienceYears
                            ? `${c.professionalInformation.totalExperienceYears} yrs`
                            : '0 yrs'}
                        </td>

                        {/* 5. Primary Skills (Truncated with tooltip) */}
                        <td
                          className="py-3 px-4 text-slate-600 max-w-[180px] truncate"
                          title={skills.join(', ')}
                        >
                          {skillsDisplay || 'N/A'}
                          {skills.length > 3 && (
                            <span className="text-[10px] text-slate-400 ml-1">
                              +{skills.length - 3}
                            </span>
                          )}
                        </td>

                        {/* 6. Qualification */}
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[130px]">
                          {c.education?.[0]?.degree ||
                            c.education?.[0]?.highestQualification ||
                            'N/A'}
                        </td>

                        {/* 7. Location */}
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[110px]">
                          {c.personalInformation?.currentLocation || 'N/A'}
                        </td>

                        {/* 8. HR Review Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.hrReviewStatus === 'Suitable'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.hrReviewStatus === 'Not Suitable'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : c.hrReviewStatus === 'Needs Review'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {c.hrReviewStatus || 'Pending'}
                          </span>
                        </td>

                        {/* 9. Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/hr/candidates/${c._id}`)}
                              title="View Complete Profile"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(c)}
                              title="Edit Candidate Information"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => navigate(`/hr/assignment?candidateId=${c._id}`)}
                              title="Select for Manager Assignment"
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Assign</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {candidates.map((c) => {
                const skills = [
                  ...(c.skills?.technicalSkills || []),
                  ...(c.skills?.programmingLanguages || []),
                ];
                return (
                  <div key={c._id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          onClick={() => navigate(`/hr/candidates/${c._id}`)}
                          className="font-bold text-slate-900 text-sm hover:text-teal-600 text-left block"
                        >
                          {c.personalInformation?.fullName || 'Not Available'}
                        </button>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {c.candidateId} • {c.professionalInformation?.totalExperienceYears || 0} yrs exp
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.hrReviewStatus === 'Suitable'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.hrReviewStatus === 'Not Suitable'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.hrReviewStatus || 'Pending'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-0.5">
                      <div>
                        <span className="text-slate-400">Email:</span> {c.personalInformation?.email || 'N/A'}
                      </div>
                      <div>
                        <span className="text-slate-400">Phone:</span> {c.personalInformation?.phone || 'N/A'}
                      </div>
                      <div>
                        <span className="text-slate-400">Skills:</span>{' '}
                        <span className="text-slate-700 font-medium">
                          {skills.slice(0, 3).join(', ') || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/hr/candidates/${c._id}`)}
                          className="text-teal-600 font-semibold flex items-center gap-0.5"
                        >
                          <span>Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="text-slate-500 font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                      <button
                        onClick={() => navigate(`/hr/assignment?candidateId=${c._id}`)}
                        className="px-3 py-1 bg-teal-600 text-white rounded-lg font-bold text-xs shadow-xs"
                      >
                        Assign Manager
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Total Candidates: <span className="font-bold text-slate-700">{pagination.total}</span>
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

      {/* INTEGRATED RESUME UPLOAD MODAL */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => !isUploading && setIsUploadModalOpen(false)}
        title="Upload Resumes"
        subtitle="Extract candidate information automatically via native document parser (PDF, DOCX, OCR)"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setUploadMode('single')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                uploadMode === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Resume
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('bulk')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                uploadMode === 'bulk'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multiple Files
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('folder')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                uploadMode === 'folder'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Folder Upload
            </button>
          </div>

          {/* Single Upload Area */}
          {uploadMode === 'single' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/20 text-center">
                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-800">
                  {singleFile ? singleFile.name : 'Select or drop resume document'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Supported formats: PDF, DOCX, DOC, Scanned Image (Max 15MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSingleFile(e.target.files[0]);
                      setUploadError(null);
                    }
                  }}
                />
              </label>

              {singleFile && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-semibold text-teal-900 truncate">{singleFile.name}</span>
                    <span className="text-[10px] text-teal-600">
                      ({Math.round(singleFile.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSingleFile(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={!singleFile || isUploading}
                onClick={handleSingleUpload}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Start Extraction</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Multiple Files Upload Area */}
          {uploadMode === 'bulk' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/20 text-center">
                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-800">
                  {bulkFiles.length > 0
                    ? `${bulkFiles.length} files selected`
                    : 'Select multiple resume files'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Hold Ctrl/Cmd to select up to 50 resumes at once
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setBulkFiles(Array.from(e.target.files));
                      setUploadError(null);
                    }
                  }}
                />
              </label>

              {bulkFiles.length > 0 && (
                <div className="max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  {bulkFiles.map((f, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600 px-2 py-1">
                      <span className="truncate max-w-[220px]">{f.name}</span>
                      <span className="text-[10px] text-slate-400">{Math.round(f.size / 1024)} KB</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                disabled={bulkFiles.length === 0 || isUploading}
                onClick={handleBulkUpload}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading Batch...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload {bulkFiles.length} Resumes</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Folder Upload Area */}
          {uploadMode === 'folder' && (
            <div className="space-y-3">
              <div
                onClick={() => folderInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/20 text-center"
              >
                <FolderUp className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-800">
                  {bulkFiles.length > 0
                    ? `${bulkFiles.length} files discovered in folder`
                    : 'Choose a folder from your computer'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Extracts all valid PDF and DOCX files automatically
                </span>
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  {...({ webkitdirectory: '' } as any)}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      const validFiles = Array.from(e.target.files).filter((file) =>
                        ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'].some((ext) =>
                          file.name.toLowerCase().endsWith(ext)
                        )
                      );
                      setBulkFiles(validFiles);
                      setUploadError(null);
                    }
                  }}
                />
              </div>

              {bulkFiles.length > 0 && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800">
                  Discovered <span className="font-bold">{bulkFiles.length}</span> resume files ready for ingestion.
                </div>
              )}

              <button
                type="button"
                disabled={bulkFiles.length === 0 || isUploading}
                onClick={handleBulkUpload}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Folder...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Ingest Folder Documents ({bulkFiles.length})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Progress message */}
          {uploadProgressMsg && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{uploadProgressMsg}</span>
            </div>
          )}

          {/* Error message */}
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Data privacy notice */}
          <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            Ephemeral Data Policy: Original PDF/DOCX files are deleted from storage immediately after candidate information is parsed.
          </div>
        </div>
      </Modal>

      {/* QUICK EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSavingEdit && setIsEditModalOpen(false)}
        title="Edit Candidate Information"
        subtitle={`Updating profile records for ${editingCandidate?.candidateId || 'Candidate'}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editFormData.fullName || ''}
                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Phone</label>
              <input
                type="text"
                value={editFormData.phone || ''}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Total Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={editFormData.totalExperienceYears || ''}
                onChange={(e) => setEditFormData({ ...editFormData, totalExperienceYears: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Location</label>
              <input
                type="text"
                value={editFormData.currentLocation || ''}
                onChange={(e) => setEditFormData({ ...editFormData, currentLocation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Highest Qualification / Degree</label>
              <input
                type="text"
                value={editFormData.degree || ''}
                onChange={(e) => setEditFormData({ ...editFormData, degree: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">HR Review Status</label>
              <select
                value={editFormData.hrReviewStatus || 'Pending'}
                onChange={(e) => setEditFormData({ ...editFormData, hrReviewStatus: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="Suitable">Suitable (Approved for Manager Assignment)</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Not Suitable">Not Suitable</option>
                <option value="Pending">Pending Review</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">HR Internal Notes</label>
              <textarea
                rows={2}
                value={editFormData.hrEvaluationNotes || ''}
                onChange={(e) => setEditFormData({ ...editFormData, hrEvaluationNotes: e.target.value })}
                placeholder="Add internal evaluation feedback or notes..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSavingEdit}
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
            >
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
