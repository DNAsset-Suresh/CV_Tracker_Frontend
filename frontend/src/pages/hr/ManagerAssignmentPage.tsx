import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  ChevronRight,
} from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { requirementService } from '../../services/requirementService';
import { userService } from '../../services/userService';
import { assignmentService } from '../../services/assignmentService';
import { aiService } from '../../services/aiService';
import { Modal } from '../../components/common/Modal';

export const ManagerAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  // Selection States
  const [selectedCandidateId, setSelectedCandidateId] = useState(
    searchParams.get('candidateId') || ''
  );
  const [selectedRequirementId, setSelectedRequirementId] = useState(
    searchParams.get('requirementId') || ''
  );
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [hrNotes, setHrNotes] = useState('');

  // UI States
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAssignment, setSuccessAssignment] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch Candidates and Requirements
  useEffect(() => {
    const initData = async () => {
      try {
        const [candRes, reqRes] = await Promise.all([
          candidateService.getCandidates({ limit: 100 }),
          requirementService.getRequirements({ limit: 50, status: 'Active' }),
        ]);

        if (candRes.success) setCandidates(candRes.candidates || []);
        if (reqRes.success) setRequirements(reqRes.requirements || []);
      } catch (err) {
        console.error('Failed to load candidates or requirements:', err);
      }
    };
    initData();
  }, []);

  // When a candidate is selected, if they already have a primaryRequirementId, auto-select it
  useEffect(() => {
    if (selectedCandidateId) {
      const cand = candidates.find((c) => c._id === selectedCandidateId);
      if (cand && cand.primaryRequirementId && !selectedRequirementId) {
        const reqId = typeof cand.primaryRequirementId === 'object'
          ? cand.primaryRequirementId._id
          : cand.primaryRequirementId;
        setSelectedRequirementId(reqId);
      }
      if (cand && cand.hrEvaluationNotes && !hrNotes) {
        setHrNotes(cand.hrEvaluationNotes);
      }
    }
  }, [selectedCandidateId, candidates]);

  // When selectedRequirementId changes, fetch managers matching that classification
  useEffect(() => {
    if (!selectedRequirementId) {
      setManagers([]);
      setSelectedManagerId('');
      return;
    }

    const req = requirements.find((r) => r._id === selectedRequirementId);
    if (!req) return;

    const fetchDepartmentManagers = async () => {
      setIsLoadingManagers(true);
      try {
        const res = await userService.getManagersByClassification(req.department);
        if (res.success) {
          setManagers(res.managers || []);
          if (res.managers && res.managers.length > 0) {
            setSelectedManagerId(res.managers[0]._id);
          } else {
            setSelectedManagerId('');
          }
        }
      } catch (err) {
        console.error('Failed to fetch managers:', err);
      } finally {
        setIsLoadingManagers(false);
      }
    };

    fetchDepartmentManagers();
  }, [selectedRequirementId, requirements]);

  const selectedCandidate = candidates.find((c) => c._id === selectedCandidateId);
  const selectedRequirement = requirements.find((r) => r._id === selectedRequirementId);
  const selectedManager = managers.find((m) => m._id === selectedManagerId);

  // Validate form before showing confirmation summary
  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedCandidateId) {
      setErrorMessage('Please select a candidate to assign.');
      return;
    }
    if (!selectedRequirementId) {
      setErrorMessage('Please select a target job requirement.');
      return;
    }
    if (!selectedManagerId) {
      setErrorMessage('Please select an active manager matching the requirement classification.');
      return;
    }
    if (!interviewDate || !interviewTime) {
      setErrorMessage('Please specify the planned interview date and time.');
      return;
    }

    setShowConfirmation(true);
  };

  // Final Confirmation Submit
  const handleConfirmAssignment = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        candidateId: selectedCandidateId,
        requirementId: selectedRequirementId,
        managerId: selectedManagerId,
        interviewDate,
        interviewTime,
        notes: hrNotes,
      };

      const res = await assignmentService.createAssignment(payload);
      if (res.success) {
        setSuccessAssignment(res.assignment);
        setShowConfirmation(false);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to complete candidate assignment.'
      );
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const candidateSkills = [
    ...(selectedCandidate?.skills?.technicalSkills || []),
    ...(selectedCandidate?.skills?.programmingLanguages || []),
    ...(selectedCandidate?.skills?.domainSpecific || []),
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Candidate Assignment Workflow
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign HR-evaluated candidates to matching Departmental Managers with planned interview details.
          </p>
        </div>
        <button
          onClick={() => navigate('/hr/assignment-history')}
          className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
        >
          <span>View Assignment History</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* SUCCESS SCREEN */}
      {successAssignment ? (
        <div className="bg-white rounded-xl border border-emerald-200 p-8 shadow-xs text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Assignment Dispatched Successfully</h2>
            <p className="text-xs text-slate-500">
              Assignment Reference: <span className="font-bold text-slate-800">{successAssignment.assignmentId}</span>
            </p>
          </div>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Candidate <span className="font-bold text-slate-800">{selectedCandidate?.personalInformation?.fullName}</span> has been assigned to{' '}
            <span className="font-bold text-slate-800">{selectedManager?.name}</span> ({selectedManager?.managerClassification}). Live notification has been delivered.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSuccessAssignment(null);
                setSelectedCandidateId('');
                setSelectedRequirementId('');
                setSelectedManagerId('');
                setInterviewDate('');
                setInterviewTime('');
                setHrNotes('');
              }}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold"
            >
              Assign Another Candidate
            </button>
            <button
              onClick={() => navigate('/hr/assignment-history')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Go to Assignment History
            </button>
          </div>
        </div>
      ) : (
        /* ASSIGNMENT FORM */
        <form onSubmit={handleProceedToConfirmation} className="space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SELECT CANDIDATE */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Select Candidate
              </h2>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Candidate Profile
              </label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="">-- Choose Candidate --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.personalInformation?.fullName || 'Candidate'} ({c.candidateId}) —{' '}
                    {c.professionalInformation?.totalExperienceYears || 0} yrs exp [Review:{' '}
                    {c.hrReviewStatus || 'Pending'}]
                  </option>
                ))}
              </select>
            </div>

            {selectedCandidate && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {selectedCandidate.personalInformation?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCandidate.personalInformation?.phone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Experience</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCandidate.professionalInformation?.totalExperienceYears || 0} yrs
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">HR Review Status</span>
                  <span
                    className={`font-bold ${
                      selectedCandidate.hrReviewStatus === 'Suitable'
                        ? 'text-emerald-600'
                        : selectedCandidate.hrReviewStatus === 'Not Suitable'
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {selectedCandidate.hrReviewStatus || 'Pending'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: SELECT REQUIREMENT */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Select Job Requirement & Department
              </h2>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Target Requirement
              </label>
              <select
                value={selectedRequirementId}
                onChange={(e) => setSelectedRequirementId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="">-- Choose Job Requirement --</option>
                {requirements.map((req) => (
                  <option key={req._id} value={req._id}>
                    {req.title} — Department: {req.department} ({req.vacancies || 1} open)
                  </option>
                ))}
              </select>
            </div>

            {selectedRequirement && (
              <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Target Department:</span>{' '}
                  <span className="font-bold text-teal-900">{selectedRequirement.department}</span>
                </div>
                <div className="text-[11px] text-teal-700">
                  Matches only: <span className="font-bold">{selectedRequirement.department} Managers</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: SELECT MATCHING MANAGER */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Select Departmental Manager
              </h2>
            </div>

            {isLoadingManagers ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Loading matching classification managers...
              </div>
            ) : !selectedRequirementId ? (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-400">
                Please select a job requirement above to view matching departmental managers.
              </div>
            ) : managers.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                No active managers found for classification: <span className="font-bold">{selectedRequirement?.department} Manager</span>.
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Department Manager ({selectedRequirement?.department} Classification)
                </label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} — {m.managerClassification} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* STEP 4: INTERVIEW SCHEDULE & HR NOTES */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                4
              </div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Planned Interview Schedule & HR Notes
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Planned Interview Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Planned Interview Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-semibold text-slate-700 block mb-1">
                HR Evaluation Notes & Instructions for Manager
              </label>
              <textarea
                rows={3}
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                placeholder="Include candidate screening feedback, key areas to probe, or evaluation instructions..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 leading-relaxed"
              />
            </div>

            {/* Crucial Manual Comms Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>
                Manual Candidate Communication: The system does not dispatch automated emails or phone calls. HR personally contacts the candidate through their preferred communication channel to confirm the schedule.
              </span>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all"
            >
              <span>Review & Confirm Assignment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* CONFIRMATION SUMMARY MODAL */}
      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Candidate Assignment"
        subtitle="Review all details before dispatching to the Departmental Manager"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Candidate Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedCandidate?.personalInformation?.fullName || 'N/A'}
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  {selectedCandidate?.personalInformation?.email} • {selectedCandidate?.personalInformation?.phone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Experience</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedCandidate?.professionalInformation?.totalExperienceYears || 0} years
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Target Job Requirement</span>
                <span className="font-bold text-slate-900">{selectedRequirement?.title}</span>
                <span className="text-teal-700 text-[11px] block">{selectedRequirement?.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Assigned Manager</span>
                <span className="font-bold text-slate-900">{selectedManager?.name}</span>
                <span className="text-slate-500 text-[11px] block">{selectedManager?.managerClassification}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Planned Interview Date</span>
                <span className="font-bold text-slate-900">{interviewDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Planned Interview Time</span>
                <span className="font-bold text-slate-900">{interviewTime}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-1">HR Notes</span>
              <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                {hrNotes || 'No notes entered.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowConfirmation(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold"
            >
              Back to Edit
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmAssignment}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm & Send to Manager'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
