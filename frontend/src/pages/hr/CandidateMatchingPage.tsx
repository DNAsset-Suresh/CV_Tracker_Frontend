import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { requirementService } from '../../services/requirementService';
import { aiService } from '../../services/aiService';

export const CandidateMatchingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(searchParams.get('candidateId') || '');
  const [selectedRequirementId, setSelectedRequirementId] = useState(searchParams.get('requirementId') || '');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [candRes, reqRes] = await Promise.all([
          candidateService.getCandidates({ limit: 50 }),
          requirementService.getRequirements({ limit: 50, status: 'Active' }),
        ]);

        if (candRes.success) {
          setCandidates(candRes.candidates || []);
          if (!selectedCandidateId && candRes.candidates?.[0]) {
            setSelectedCandidateId(candRes.candidates[0]._id);
          }
        }

        if (reqRes.success) {
          setRequirements(reqRes.requirements || []);
          if (!selectedRequirementId && reqRes.requirements?.[0]) {
            setSelectedRequirementId(reqRes.requirements[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load matching candidates or requirements:', err);
      }
    };
    loadData();
  }, []);

  const handleRunMatch = async () => {
    if (!selectedCandidateId || !selectedRequirementId) return;
    setIsEvaluating(true);
    setMatchResult(null);

    try {
      const res = await aiService.matchCandidateWithRequirement(
        selectedCandidateId,
        selectedRequirementId
      );
      if (res.success) {
        setMatchResult(res.matchResult);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'AI Matching evaluation failed');
    } finally {
      setIsEvaluating(false);
    }
  };

  const selectedCand = candidates.find((c) => c._id === selectedCandidateId);
  const selectedReq = requirements.find((r) => r._id === selectedRequirementId);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Requirement Matching Engine</h1>
        <p className="text-xs text-slate-500 mt-1">
          Compare candidate profiles against job requirement criteria with transparent, explainable scoring.
        </p>
      </div>

      {/* Selectors Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              1. Select Candidate Profile
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => {
                setSelectedCandidateId(e.target.value);
                setMatchResult(null);
              }}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 font-semibold text-slate-800"
            >
              <option value="">Select Candidate...</option>
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.personalInformation?.fullName} ({c.candidateId}) —{' '}
                  {c.professionalInformation?.currentDesignation || 'Candidate'}
                </option>
              ))}
            </select>

            {selectedCand && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600 border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-700">Total Experience:</span>{' '}
                  {selectedCand.professionalInformation?.totalExperienceYears} Years
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Primary Skills:</span>{' '}
                  {(selectedCand.skills?.technicalSkills || []).slice(0, 5).join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Job Requirement Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              2. Select Job Requirement
            </label>
            <select
              value={selectedRequirementId}
              onChange={(e) => {
                setSelectedRequirementId(e.target.value);
                setMatchResult(null);
              }}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500 font-semibold text-slate-800"
            >
              <option value="">Select Requirement...</option>
              {requirements.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.title} ({r.department}) — {r.minExperience}–{r.maxExperience} yrs
                </option>
              ))}
            </select>

            {selectedReq && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600 border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-700">Department:</span>{' '}
                  <span className="font-bold text-slate-900">{selectedReq.department}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Required Skills:</span>{' '}
                  {(selectedReq.requiredSkills || []).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleRunMatch}
            disabled={!selectedCandidateId || !selectedRequirementId || isEvaluating}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {isEvaluating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating Criteria with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI Match Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI MATCH RESULT DISPLAY */}
      {matchResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Evaluation Outcome
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">
                {selectedCand?.personalInformation?.fullName} vs {selectedReq?.title}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Department: {selectedReq?.department}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Match Score</span>
                <div className="text-3xl font-black text-teal-600">
                  {matchResult.overallScore}%
                </div>
              </div>
              <span className="px-3.5 py-1.5 bg-teal-50 text-teal-800 font-extrabold text-xs rounded-full border border-teal-200">
                {matchResult.recommendation}
              </span>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills Comparison */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Skills Alignment Breakdown
              </h3>
              <div>
                <span className="text-[11px] font-bold text-emerald-700 block mb-1.5">
                  Matched Skills ({(matchResult.skillsMatch?.matched || []).length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {(matchResult.skillsMatch?.matched || []).map((s: string) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded text-xs font-semibold border border-emerald-200"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-rose-700 block mb-1.5">
                  Missing Skills ({(matchResult.skillsMatch?.missing || []).length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {(matchResult.skillsMatch?.missing || []).length === 0 ? (
                    <span className="text-xs text-slate-400 italic">None. All requirements met.</span>
                  ) : (
                    matchResult.skillsMatch?.missing?.map((s: string) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 bg-rose-50 text-rose-800 rounded text-xs font-semibold border border-rose-200"
                      >
                        ✕ {s}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Experience & Education Comparison */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Experience & Education Benchmark
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">Required Experience:</span>
                  <span className="font-bold text-slate-800">
                    {matchResult.experienceMatch?.requiredMin}–
                    {matchResult.experienceMatch?.requiredMax} Years
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">Candidate Total Experience:</span>
                  <span className="font-bold text-slate-900">
                    {matchResult.experienceMatch?.candidateTotal} Years
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">Experience Alignment:</span>
                  <span className="font-bold text-emerald-700">
                    {matchResult.experienceMatch?.isMatch ? '✓ Within Optimal Range' : 'Attention Required'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Education Benchmark:</span>
                  <span className="font-bold text-slate-800">
                    {matchResult.educationMatch?.candidateHighest || 'Degree Verified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-2">
                Strengths
              </span>
              <ul className="text-xs text-slate-700 space-y-1">
                {(matchResult.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-amber-50/30 rounded-xl border border-amber-100">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-2">
                Potential Gaps / Considerations
              </span>
              <ul className="text-xs text-slate-700 space-y-1">
                {(matchResult.potentialGaps || []).length === 0 ? (
                  <li className="text-slate-400 italic">None noted.</li>
                ) : (
                  matchResult.potentialGaps?.map((g: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{g}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* AI Explanation Callout */}
          <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 text-xs text-slate-800">
            <span className="font-bold text-teal-900 block mb-1">
              AI Scoring Transparency & Rationale:
            </span>
            {matchResult.explanation}
          </div>

          {/* Proceed to Assignment CTA */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Satisfied with the evaluation? Route this candidate to the departmental manager.
            </span>
            <button
              onClick={() =>
                navigate(
                  `/hr/assign?candidateId=${selectedCandidateId}&requirementId=${selectedRequirementId}`
                )
              }
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Proceed to Assign to Manager</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

