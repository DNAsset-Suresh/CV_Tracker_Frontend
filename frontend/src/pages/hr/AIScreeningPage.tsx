import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, AlertCircle, CheckCircle2, UserCheck, Eye, Search } from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/Badge';

export const AIScreeningPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'needs_review' | 'verified'>('all');

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await candidateService.getCandidates({ limit: 50 });
      if (res.success) {
        setCandidates(res.candidates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      await candidateService.verifyCandidate(id);
      fetchCandidates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const filtered = candidates.filter((c) => {
    if (filterType === 'needs_review') return !c.isVerifiedByHR;
    if (filterType === 'verified') return c.isVerifiedByHR;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Resume Screening & Verification</h1>
          <p className="text-xs text-slate-500 mt-1">
            Human-in-the-loop review of AI-extracted candidate profiles before manager allocation.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            filterType === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Extracted ({candidates.length})
        </button>
        <button
          onClick={() => setFilterType('needs_review')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            filterType === 'needs_review'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Needs Human Review ({candidates.filter((c) => !c.isVerifiedByHR).length})
        </button>
        <button
          onClick={() => setFilterType('verified')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            filterType === 'verified'
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          HR Verified ({candidates.filter((c) => c.isVerifiedByHR).length})
        </button>
      </div>

      {/* Candidate Cards Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No candidates match the selected screening stage.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const confidence = Math.round((c.extractionConfidence || 0.9) * 100);
            return (
              <div
                key={c._id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-mono text-[11px] text-slate-400 font-semibold">
                      {c.candidateId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        confidence >= 90
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      AI Confidence: {confidence}%
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-3">
                    {c.personalInformation?.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {c.professionalInformation?.currentDesignation || 'Candidate'} •{' '}
                    <span className="text-slate-400">
                      {c.professionalInformation?.totalExperienceYears || 0} yrs exp
                    </span>
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {(c.skills?.technicalSkills || []).slice(0, 4).map((s: string) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {c.isVerifiedByHR ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleVerify(c._id)}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold border border-teal-200"
                    >
                      Mark Verified
                    </button>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/hr/candidates/${c._id}`)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      title="Inspect Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigate(`/hr/assign?candidateId=${c._id}`)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white"
                      title="Assign Manager"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

