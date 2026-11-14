import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  FolderUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Trash2,
  FileCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { resumeService } from '../../services/resumeService';
import { StatusBadge } from '../../components/common/Badge';

export const ResumeUploadPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const singleInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Poll batch status if batch is active
  useEffect(() => {
    let interval: any;
    if (uploadResult?.batchId && (!batchStatus || !batchStatus.summary?.isCompleted)) {
      const checkStatus = async () => {
        try {
          const res = await resumeService.getBatchStatus(uploadResult.batchId);
          if (res.success) {
            setBatchStatus(res);
          }
        } catch (e) {
          // ignore
        }
      };
      checkStatus();
      interval = setInterval(checkStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [uploadResult?.batchId, batchStatus?.summary?.isCompleted]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      /\.(pdf|doc|docx|png|jpg|jpeg)$/i.test(file.name)
    );

    if (activeTab === 'single') {
      if (droppedFiles.length > 0) setSingleFile(droppedFiles[0]);
    } else {
      setBulkFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  // Single Resume Upload Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleFile) return;

    setIsUploading(true);
    setErrorMessage('');
    setUploadResult(null);

    try {
      const res = await resumeService.uploadSingle(singleFile);
      if (res.success) {
        setUploadResult(res);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Bulk Resume Upload Submit
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkFiles.length === 0) return;

    setIsUploading(true);
    setErrorMessage('');
    setBatchStatus(null);

    try {
      const res = await resumeService.uploadBulk(bulkFiles);
      if (res.success) {
        setUploadResult(res);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Bulk upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRetryResume = async (resumeId: string) => {
    try {
      await resumeService.retryResume(resumeId);
      if (uploadResult?.batchId) {
        const res = await resumeService.getBatchStatus(uploadResult.batchId);
        if (res.success) setBatchStatus(res);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Retry failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Resume Upload & Processing Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Intake individual or bulk candidate resumes with asynchronous AI feature extraction.
          </p>
        </div>
        <button
          onClick={() => navigate('/hr/upload-history')}
          className="text-xs font-semibold text-teal-600 hover:text-teal-700"
        >
          View Full Upload History →
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('single');
            setUploadResult(null);
            setBatchStatus(null);
          }}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'single'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Single Resume Upload
        </button>
        <button
          onClick={() => {
            setActiveTab('bulk');
            setUploadResult(null);
            setBatchStatus(null);
          }}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'bulk'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bulk Upload & Folder Intake
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SINGLE UPLOAD TAB */}
      {activeTab === 'single' && (
        <div className="space-y-6">
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => singleInputRef.current?.click()}
              className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                ref={singleInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSingleFile(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                {singleFile ? singleFile.name : 'Click to upload or drag & drop resume'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: PDF, DOCX, DOC (Up to 15 MB)
              </p>
              {singleFile && (
                <div className="mt-3 px-3 py-1 bg-teal-100/60 text-teal-800 text-[11px] font-semibold rounded-full">
                  {(singleFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!singleFile || isUploading}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading & Queuing AI Parser...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Upload & Extract Candidate Info</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Single Upload Success Banner */}
          {uploadResult && (
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm animate-fade-in space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Resume Queued for AI Extraction
                  </h4>
                  <p className="text-xs text-slate-500">
                    File "{uploadResult.resume?.originalFileName}" is being analyzed asynchronously.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <div>
                  <span className="font-semibold text-slate-600">Resume ID:</span>{' '}
                  <span className="font-mono text-slate-800">{uploadResult.resume?._id}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Storage Key:</span>{' '}
                  <span className="font-mono text-slate-800">
                    {uploadResult.resume?.storageKey}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/hr/candidates')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                >
                  View Candidate Database
                </button>
                <button
                  onClick={() => {
                    setSingleFile(null);
                    setUploadResult(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Upload Another Resume
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BULK UPLOAD TAB */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                <FolderUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                Drag & Drop multiple resumes or select an entire folder
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Background queue will process each resume independently without blocking.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <input
                  ref={bulkInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setBulkFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => bulkInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Select Multiple Files
                </button>

                <input
                  ref={folderInputRef}
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      const validDocs = Array.from(e.target.files).filter((f) =>
                        /\.(pdf|doc|docx)$/i.test(f.name)
                      );
                      setBulkFiles((prev) => [...prev, ...validDocs]);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold"
                >
                  Upload Entire Folder
                </button>
              </div>
            </div>

            {/* Selected Files List */}
            {bulkFiles.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Selected Resumes ({bulkFiles.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setBulkFiles([])}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                  {bulkFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="pt-1.5 flex items-center justify-between text-xs text-slate-700"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-slate-400 text-[10px]">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBulkFile(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {isUploading ? 'Dispatching Batch...' : `Process All ${bulkFiles.length} Resumes`}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Batch Processing Progress Display */}
          {batchStatus && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Batch Execution Summary: {batchStatus.batchId}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time status of individual candidate resume jobs.
                  </p>
                </div>
                {batchStatus.summary?.isCompleted ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Batch Complete
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200 flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-4 h-4" /> Processing ({batchStatus.summary?.remaining} remaining)
                  </span>
                )}
              </div>

              {/* Summary Counter Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total</span>
                  <p className="text-base font-extrabold text-slate-800 mt-0.5">
                    {batchStatus.summary?.total}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Extracted</span>
                  <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                    {batchStatus.summary?.extracted}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-indigo-700">In Progress</span>
                  <p className="text-base font-extrabold text-indigo-700 mt-0.5">
                    {batchStatus.summary?.processing + batchStatus.summary?.queued}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-rose-700">Failed</span>
                  <p className="text-base font-extrabold text-rose-700 mt-0.5">
                    {batchStatus.summary?.failed}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-amber-700">Duplicate</span>
                  <p className="text-base font-extrabold text-amber-700 mt-0.5">
                    {batchStatus.summary?.duplicate}
                  </p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Remaining</span>
                  <p className="text-base font-extrabold text-slate-700 mt-0.5">
                    {batchStatus.summary?.remaining}
                  </p>
                </div>
              </div>

              {/* Individual File Status Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4">File Name</th>
                      <th className="py-2.5 px-4">Processing Status</th>
                      <th className="py-2.5 px-4">Details / Errors</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {batchStatus.resumes?.map((resItem: any) => {
                      const currentStatus = resItem.processingStatus;

                      return (
                        <tr key={resItem._id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4 font-semibold text-slate-900 truncate max-w-xs">
                            {resItem.originalFileName}
                          </td>
                          <td className="py-2.5 px-4">
                            <StatusBadge status={currentStatus} />
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                            {resItem.errorMessage || (resItem.candidateId ? 'Profile Extracted' : '—')}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {currentStatus === 'Failed' && (
                              <button
                                onClick={() => handleRetryResume(resItem._id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                              >
                                <RotateCcw className="w-3 h-3" /> Retry
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

