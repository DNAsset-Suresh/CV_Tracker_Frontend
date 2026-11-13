import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { managerService } from '../../services/managerService';
import { Modal } from '../../components/common/Modal';

export const CandidateEvaluationPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [candidate, setCandidate] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [requirement, setRequirement] = useState<any>(null);
  const [rawExtractedText, setRawExtractedText] = useState<string>('');
  const [matchScore, setMatchScore] = useState<number | null>(null);

  // Popup Modal state for Extracted Resume Text
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Evaluation Form State (Ratings removed on both desktop and mobile per user request)
  const [evalDecision, setEvalDecision] = useState<'Shortlist' | 'Reject' | 'Hold' | 'Recommend Next Round'>('Shortlist');
  const [strengths, setStrengths] = useState<string>('');
  const [weaknesses, setWeaknesses] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    const fetchEvaluationData = async () => {
      if (!candidateId) return;
      try {
        setLoading(true);
        setError('');
        const res = await managerService.getCandidateEvaluationDetails(candidateId);
        if (res.success) {
          setCandidate(res.candidate);
          setAssignment(res.assignment);
          setRequirement(res.requirement);
          setRawExtractedText(res.rawExtractedText || '');
          setMatchScore(res.matchScore);
        } else {
          setError(res.message || 'Failed to load candidate assignment details.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Error fetching evaluation details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationData();
  }, [candidateId]);

  const handleCopyText = () => {
    if (rawExtractedText) {
      navigator.clipboard.writeText(rawExtractedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate || !assignment) return;

    if (!comments.trim()) {
      setSubmitError('Please provide evaluation feedback comments before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');

      const payload = {
        candidateId: candidate._id,
        assignmentId: assignment._id,
        evaluationStatus: evalDecision,
        comments: comments.trim(),
        strengths: strengths ? strengths.split(',').map((s) => s.trim()).filter(Boolean) : [],
        weaknesses: weaknesses ? weaknesses.split(',').map((w) => w.trim()).filter(Boolean) : [],
        rejectionReason: evalDecision === 'Reject' ? comments.trim() : undefined,
      };

      const res = await managerService.submitFeedback(payload);
      if (res.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          navigate('/manager/candidates');
        }, 1200);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to submit candidate evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Candidate Evaluation Workspace...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm mb-4">
          <AlertCircle className="w-7 h-7 text-rose-600 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-rose-900">Assignment Not Accessible</h3>
          <p className="text-xs mt-1">{error || 'Candidate assignment could not be found or is not assigned to your account.'}</p>
        </div>
        <button
          onClick={() => navigate('/manager/candidates')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to My Assigned Candidates
        </button>
      </div>
    );
  }

  const candidateName = candidate.personalInformation?.fullName || 'Candidate';
  const roleTitle = requirement?.title || 'Target Job Role';
  const department = requirement?.department || 'Operations';

  return (
    <div className="max-w-7xl mx-auto">
      {/* ======================================================== */}
      {/* 1. MOBILE VIEW (< lg): ZERO-SCROLL COMPACT DISPLAY       */}
      {/* ======================================================== */}
      <div className="block lg:hidden space-y-2.5">
        {/* Mobile Header: Back button + Candidate + Role + Resume CTA */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/manager/candidates')}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 truncate">{candidateName}</h1>
              <p className="text-[11px] text-teal-700 font-medium truncate">{roleTitle} • {department}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsResumeModalOpen(true)}
            className="px-2.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-2xs hover:bg-teal-100 transition"
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>Resume</span>
          </button>
        </div>

        {/* Success / Error Banners on Mobile */}
        {submitSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Submitted! Status updated & HR notified.</span>
          </div>
        )}
        {submitError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Mobile Candidate Summary Strip (Date card removed on mobile!) */}
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-800 truncate">{candidate.personalInformation?.currentLocation || 'Location N/A'}</span>
            <span className="text-slate-300">•</span>
            <span className="shrink-0">{candidate.professionalInformation?.totalExperienceYears || 0} yrs exp</span>
            <span className="text-slate-300">•</span>
            <span className="truncate text-slate-500">{candidate.personalInformation?.email || candidate.personalInformation?.phone || ''}</span>
          </div>
          {matchScore !== null && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 ml-1.5">
              {matchScore}% Match
            </span>
          )}
        </div>

        {/* Mobile Evaluation Form: Ultra-compact to avoid scrolling */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
          {/* Assessment Decision (4 compact buttons) */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Assessment Decision <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'Shortlist', label: 'Shortlisted', color: 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500' },
                { key: 'Reject', label: 'Rejected', color: 'border-rose-300 bg-rose-50 text-rose-800 ring-2 ring-rose-500' },
                { key: 'Hold', label: 'On Hold', color: 'border-amber-300 bg-amber-50 text-amber-800 ring-2 ring-amber-500' },
                { key: 'Recommend Next Round', label: 'Next Round', color: 'border-indigo-300 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500' },
              ].map((act) => {
                const isSelected = evalDecision === act.key;
                return (
                  <button
                    key={act.key}
                    type="button"
                    onClick={() => setEvalDecision(act.key as any)}
                    className={`py-2 px-1.5 rounded-lg border text-xs font-bold text-center transition-all ${
                      isSelected ? act.color : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {act.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* In-depth Evaluation Comments (Ratings removed!) */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Evaluation Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter assessment notes and feedback for HR..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white leading-relaxed resize-none"
            />
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => navigate('/manager/candidates')}
              className="w-1/3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Evaluation'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP VIEW (lg:): COMPLETE WORKSPACE WITHOUT RATINGS */}
      {/* ======================================================== */}
      <div className="hidden lg:block space-y-6 pb-12">
        {/* Top Header & Breadcrumb */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigate('/manager/candidates')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-600 transition mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to My Assigned Candidates</span>
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Evaluate Candidate: {candidateName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                {roleTitle}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {department}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Review candidate qualifications, planned interview times, and record your evaluation decision for HR.
            </p>
          </div>

          {/* View Extracted Text CTA button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResumeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-teal-500 hover:bg-teal-50/30 text-slate-800 hover:text-teal-900 rounded-xl text-xs font-bold shadow-xs transition"
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>View Extracted Resume (Popup)</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT COLUMN: CANDIDATE CONTEXT & PROFILE (5 COLS) */}
          <div className="col-span-5 space-y-5">
            {/* PLANNED INTERVIEW SCHEDULE & HR NOTES CARD (Visible on Desktop) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Planned Interview Schedule
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Assigned: {new Date(assignment?.assignedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-teal-50/40 border border-teal-100 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Interview Date</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {assignment?.interviewDate || 'Date Not Specified'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Interview Time</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {assignment?.interviewTime || 'Time Not Specified'}
                  </span>
                </div>
              </div>

              {assignment?.notes && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                    HR Recruiter Notes & Briefing
                  </span>
                  <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    "{assignment.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* CANDIDATE PROFILE & BACKGROUND CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                    Candidate Profile
                  </span>
                </div>
                {matchScore !== null && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {matchScore}% Match Score
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Email</span>
                  <span className="font-semibold text-slate-800 truncate block" title={candidate.personalInformation?.email}>
                    {candidate.personalInformation?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Phone</span>
                  <span className="font-semibold text-slate-800 block">
                    {candidate.personalInformation?.phone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Location</span>
                  <span className="font-semibold text-slate-800 block">
                    {candidate.personalInformation?.currentLocation || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Experience</span>
                  <span className="font-semibold text-slate-800 block">
                    {candidate.professionalInformation?.totalExperienceYears || 0} Years
                  </span>
                </div>
              </div>

              {/* Extracted Skills */}
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-2">
                  Extracted Skills & Competencies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...(candidate.skills?.technicalSkills || []),
                    ...(candidate.skills?.programmingLanguages || []),
                    ...(candidate.skills?.frameworks || []),
                    ...(candidate.skills?.databases || []),
                    ...(candidate.skills?.domainSpecific || []),
                  ].map((sk: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              {candidate.education && candidate.education.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                    Education & Qualifications
                  </span>
                  <div className="text-slate-800 font-medium">
                    {candidate.education[0].highestQualification || candidate.education[0].degree}
                    <span className="text-slate-500 block text-[11px] mt-0.5">
                      {candidate.education[0].institution}
                    </span>
                  </div>
                </div>
              )}

              {/* Action to open resume popup */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResumeModalOpen(true)}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200 transition"
                >
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Open Full Extracted Resume Popup</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: MANAGER EVALUATION FORM (7 COLS, NO RATINGS) */}
          <div className="col-span-7">
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6"
            >
              {/* Form Header */}
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Send className="w-4 h-4 text-teal-600" />
                  Submit Manager Evaluation & Feedback
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Your evaluation updates candidate recruitment status and directly notifies the assigning HR recruiter.
                </p>
              </div>

              {/* Success Banner */}
              {submitSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Evaluation submitted successfully! Candidate status updated and HR notified. Redirecting...</span>
                </div>
              )}

              {/* Error Banner */}
              {submitError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Evaluation Decision */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Assessment Decision <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      key: 'Shortlist',
                      label: 'Shortlisted',
                      color: 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500',
                    },
                    {
                      key: 'Reject',
                      label: 'Rejected',
                      color: 'border-rose-300 bg-rose-50 text-rose-800 ring-2 ring-rose-500',
                    },
                    {
                      key: 'Hold',
                      label: 'On Hold',
                      color: 'border-amber-300 bg-amber-50 text-amber-800 ring-2 ring-amber-500',
                    },
                    {
                      key: 'Recommend Next Round',
                      label: 'Next Round',
                      color: 'border-indigo-300 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500',
                    },
                  ].map((act) => {
                    const isSelected = evalDecision === act.key;
                    return (
                      <button
                        key={act.key}
                        type="button"
                        onClick={() => setEvalDecision(act.key as any)}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          isSelected
                            ? act.color
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {act.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Weaknesses (Ratings removed on desktop!) */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Candidate Strengths
                  </label>
                  <input
                    type="text"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="e.g. System design, fast learning, proactive"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Areas of Concern / Gaps
                  </label>
                  <input
                    type="text"
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                    placeholder="e.g. Needs mentorship on cloud devops"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* In-depth Evaluation Feedback Comments */}
              <div className="pt-2 border-t border-slate-100 text-xs">
                <label className="font-bold text-slate-800 block mb-1.5">
                  Manager Evaluation Comments & Decision Notes 
                </label>
                <textarea
                  rows={5}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Detail your assessment of the candidate's interview performance, technical depth, suitability for the department, and recommendations for next steps..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => navigate('/manager/candidates')}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Assessment...' : 'Submit Evaluation to HR'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* EXTRACTED RESUME TEXT POPUP MODAL (Available on both Mobile & Desktop) */}
      <Modal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        title={`Extracted Resume: ${candidateName}`}
        subtitle={`Target Role: ${roleTitle} (${department})`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs text-slate-500">
              Extracted document text parsed from uploaded resume (ephemeral zero-cloud storage).
            </span>
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-wrap select-all border border-slate-800">
            {rawExtractedText || 'Extracted document text is loading or not stored.'}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsResumeModalOpen(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
