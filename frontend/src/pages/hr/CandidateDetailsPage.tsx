import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  Calendar,
  ExternalLink,
  Edit2,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  UploadCloud,
  Info,
  RefreshCw,
  ArrowLeft,
  Award,
  CheckSquare,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react';
import { api } from '../../services/api';
import { candidateService } from '../../services/candidateService';
import { aiService } from '../../services/aiService';
import { requirementService } from '../../services/requirementService';
import { Modal } from '../../components/common/Modal';

export const CandidateDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resumeData, setResumeData] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Requirements for Matching Section
  const [requirements, setRequirements] = useState<any[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [matchResult, setMatchResult] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);

  // HR Evaluation State
  const [hrReviewStatus, setHrReviewStatus] = useState<string>('Pending');
  const [hrEvaluationNotes, setHrEvaluationNotes] = useState<string>('');
  const [suitabilityDecision, setSuitabilityDecision] = useState<string>('');
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);
  const [evalSaveSuccess, setEvalSaveSuccess] = useState(false);

  // Re-Extraction State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [reExtractFeedback, setReExtractFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Information Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchCandidate = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await candidateService.getCandidateById(id);
      if (res.success && res.candidate) {
        setData(res);
        const c = res.candidate;
        setHrReviewStatus(c.hrReviewStatus || 'Pending');
        setHrEvaluationNotes(c.hrEvaluationNotes || '');
        setSuitabilityDecision(c.suitabilityDecision || '');
        if (c.primaryRequirementId) {
          setSelectedReqId(typeof c.primaryRequirementId === 'object' ? c.primaryRequirementId._id : c.primaryRequirementId);
        }

        setEditForm({
          personalInformation: { ...(c.personalInformation || {}) },
          professionalInformation: { ...(c.professionalInformation || {}) },
          skills: { ...(c.skills || {}) },
          education: c.education ? [...c.education] : [],
        });
      }

      // Fetch resume text & retention notice
      try {
        const resumeRes = await candidateService.getResumeUrl(id);
        if (resumeRes.success) {
          setResumeData(resumeRes);
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Failed to load candidate details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  useEffect(() => {
    const loadRequirements = async () => {
      try {
        const res = await requirementService.getRequirements({ status: 'Active', limit: 50 });
        if (res.success) {
          setRequirements(res.requirements || []);
          if (!selectedReqId && res.requirements?.length > 0) {
            setSelectedReqId(res.requirements[0]._id);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    loadRequirements();
  }, []);

  // Run Rule-Based Matching
  const handleRunMatch = async (reqId: string) => {
    if (!id || !reqId) return;
    setIsMatching(true);
    try {
      const res = await aiService.matchCandidateWithRequirement(id, reqId);
      if (res.success) {
        setMatchResult(res.matchResult);
      }
    } catch (err) {
      console.error('Failed to match candidate:', err);
    } finally {
      setIsMatching(false);
    }
  };

  useEffect(() => {
    if (selectedReqId && id) {
      handleRunMatch(selectedReqId);
    }
  }, [selectedReqId]);

  // Save HR Evaluation
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSavingEvaluation(true);
    setEvalSaveSuccess(false);
    try {
      const payload = {
        hrReviewStatus,
        hrEvaluationNotes,
        suitabilityDecision,
        primaryRequirementId: selectedReqId || undefined,
      };
      const res = await candidateService.updateCandidate(id, payload);
      if (res.success) {
        setEvalSaveSuccess(true);
        setTimeout(() => setEvalSaveSuccess(false), 3000);
        fetchCandidate();
      }
    } catch (err) {
      console.error('Failed to save HR evaluation:', err);
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  // Save Full Edit Information
  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSavingEdit(true);
    try {
      const res = await candidateService.updateCandidate(id, editForm);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchCandidate();
      }
    } catch (err) {
      console.error('Failed to update candidate:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading complete candidate record...</p>
      </div>
    );
  }

  const candidate = data?.candidate;
  if (!candidate) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
        <p className="text-sm font-bold text-slate-800">Candidate Record Not Found</p>
        <button
          onClick={() => navigate('/hr/candidates')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
        >
          Back to Database
        </button>
      </div>
    );
  }

  const pi = candidate.personalInformation || {};
  const prof = candidate.professionalInformation || {};
  const skills = candidate.skills || {};
  const edu = candidate.education || [];
  const emp = prof.employmentHistory || [];
  const certs = skills.certifications || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Top Navigation & Sticky Action Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs sticky top-16 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/hr/candidates')}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Back to Database"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {pi.fullName || 'Not Available'}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    hrReviewStatus === 'Suitable'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : hrReviewStatus === 'Not Suitable'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : hrReviewStatus === 'Needs Review'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {hrReviewStatus || 'Pending Review'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ID: <span className="font-semibold text-slate-600">{candidate.candidateId}</span> •{' '}
                Total Exp: <span className="font-semibold text-slate-600">{prof.totalExperienceYears || 0} yrs</span> •{' '}
                Status: <span className="font-semibold text-slate-600">{candidate.recruitmentStatus}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Info</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/hr/assignment?candidateId=${candidate._id}`)}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign to Manager</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: PERSONAL INFORMATION */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <User className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Personal Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Full Name</span>
            <span className="font-bold text-slate-800 text-sm">{pi.fullName || 'Not Available'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Email</span>
            <span className="font-semibold text-slate-800">{pi.email || 'Not Available'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Phone</span>
            <span className="font-semibold text-slate-800">{pi.phone || 'Not Available'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Alternate Phone</span>
            <span className="font-semibold text-slate-800">{pi.alternatePhone || 'Not Available'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Location</span>
            <span className="font-semibold text-slate-800">{pi.currentLocation || 'Not Available'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Current Address</span>
            <span className="font-semibold text-slate-800">{pi.currentAddress || 'Not Available'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">LinkedIn</span>
            {pi.linkedIn ? (
              <a
                href={pi.linkedIn}
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-400">Not Available</span>
            )}
          </div>
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Portfolio / GitHub</span>
            {pi.portfolioUrl ? (
              <a
                href={pi.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View Portfolio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-400">Not Available</span>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: PROFESSIONAL SUMMARY */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Briefcase className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Professional Summary
          </h2>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-1">
              Summary Statement
            </span>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {prof.professionalSummary || 'No professional summary extracted from resume.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Total Experience</span>
              <span className="font-bold text-slate-800 text-sm">
                {prof.totalExperienceYears !== undefined ? `${prof.totalExperienceYears} yrs` : 'Not Available'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Relevant Exp</span>
              <span className="font-bold text-slate-800 text-sm">
                {prof.relevantExperienceYears !== undefined ? `${prof.relevantExperienceYears} yrs` : 'Not Available'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Current Designation</span>
              <span className="font-semibold text-slate-800">
                {prof.currentDesignation || 'Not Available'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Current Company</span>
              <span className="font-semibold text-slate-800">
                {prof.currentCompany || 'Not Available'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Notice Period</span>
              <span className="font-semibold text-slate-800">
                {prof.noticePeriodDays ? `${prof.noticePeriodDays} days` : 'Not Available'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Salary</span>
              <span className="font-semibold text-slate-800">
                {prof.currentSalary || prof.expectedSalary || 'Not Available'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SKILLS TAXONOMY */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Skills Inventory
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1.5">
              Technical Skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(skills.technicalSkills || []).length > 0 ? (
                skills.technicalSkills.map((sk: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium"
                  >
                    {sk}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Not Available</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1.5">
              Programming Languages
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(skills.programmingLanguages || []).length > 0 ? (
                skills.programmingLanguages.map((sk: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-medium border border-teal-200"
                  >
                    {sk}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Not Available</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1.5">
              Frameworks & Libraries
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(skills.frameworks || []).length > 0 ? (
                skills.frameworks.map((sk: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-medium border border-indigo-200"
                  >
                    {sk}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Not Available</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1.5">
              Databases & Storage
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(skills.databases || []).length > 0 ? (
                skills.databases.map((sk: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-200"
                  >
                    {sk}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Not Available</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1.5">
              Tools & Platforms
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(skills.tools || []).length > 0 ? (
                skills.tools.map((sk: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    {sk}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Not Available</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-1.5">
              Domain & Soft Skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[...(skills.domainSpecific || []), ...(skills.softSkills || [])].length > 0 ? (
                [...(skills.domainSpecific || []), ...(skills.softSkills || [])].map((sk: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    {sk}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Not Available</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: EMPLOYMENT HISTORY */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Employment History
          </h2>
        </div>

        {emp.length === 0 && !prof.currentCompany ? (
          <p className="text-xs text-slate-400">No employment history records extracted.</p>
        ) : (
          <div className="space-y-3">
            {emp.length > 0 ? (
              emp.map((job: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{job.designation || 'Designation Not Available'}</span>
                    <span className="text-slate-400 font-normal">
                      {job.startDate || ''} {job.endDate ? `- ${job.endDate}` : job.isCurrent ? '- Present' : ''}
                    </span>
                  </div>
                  <div className="text-teal-700 font-semibold">{job.company || 'Company'}</div>
                  {job.responsibilities && job.responsibilities.length > 0 && (
                    <ul className="list-disc pl-4 text-slate-600 space-y-0.5 pt-1">
                      {job.responsibilities.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-800">{prof.currentDesignation || 'Designation N/A'}</span>
                <div className="text-teal-700 font-semibold">{prof.currentCompany || 'Company N/A'}</div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 5: EDUCATION & CERTIFICATIONS */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <GraduationCap className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Education & Certifications
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-2">
              Academic Qualifications
            </span>
            {edu.length === 0 ? (
              <p className="text-slate-400">Not Available</p>
            ) : (
              <div className="space-y-2">
                {edu.map((e: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800">{e.degree || e.highestQualification || 'Degree'}</div>
                    <div className="text-slate-600">{e.institution || 'University / Institution'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {e.graduationYear ? `Class of ${e.graduationYear}` : ''} {e.grade ? `• Grade: ${e.grade}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-2">
              Professional Certifications
            </span>
            {certs.length === 0 ? (
              <p className="text-slate-400">Not Available</p>
            ) : (
              <div className="space-y-2">
                {certs.map((cert: string, i: number) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{cert}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6: RULE-BASED MATCHING INFORMATION */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Rule-Based Job Requirement Matching
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Evaluate against:</span>
            <select
              value={selectedReqId}
              onChange={(e) => setSelectedReqId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
            >
              {requirements.map((req) => (
                <option key={req._id} value={req._id}>
                  {req.title} ({req.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {isMatching ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
            <span>Evaluating candidate alignment...</span>
          </div>
        ) : matchResult ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                  Match Score
                </span>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {matchResult.overallScore}%
                  <span
                    className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                      matchResult.recommendation === 'Strong Match'
                        ? 'bg-emerald-100 text-emerald-800'
                        : matchResult.recommendation === 'Good Match'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {matchResult.recommendation}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                {matchResult.explanation}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-1">
                <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                  Matching Skills ({matchResult.skillsMatch?.matched?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(matchResult.skillsMatch?.matched || []).map((sk: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 space-y-1">
                <span className="font-bold text-rose-900 block text-[11px] uppercase tracking-wider">
                  Missing Benchmark Skills ({matchResult.skillsMatch?.missing?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(matchResult.skillsMatch?.missing || []).length > 0 ? (
                    matchResult.skillsMatch.missing.map((sk: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-semibold">
                        ✗ {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-700">None! All required skills matched.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Select a requirement above to preview matching score.</p>
        )}
      </section>

      {/* SECTION 7: HR EVALUATION WORKFLOW */}
      <section className="bg-white rounded-xl border-2 border-teal-500/30 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                HR Evaluation & Suitability Decision
              </h2>
              <p className="text-[11px] text-slate-400">
                HR manually evaluates and approves candidates before assignment to Departmental Managers
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Suitability Evaluation Decision
              </label>
              <select
                value={hrReviewStatus}
                onChange={(e) => setHrReviewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="Suitable">Suitable (Approved for Manager Assignment)</option>
                <option value="Needs Review">Needs Review (Requires more assessment)</option>
                <option value="Not Suitable">Not Suitable (Reject candidate)</option>
                <option value="Pending">Pending (Not yet evaluated)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Assigned Target Requirement
              </label>
              <select
                value={selectedReqId}
                onChange={(e) => setSelectedReqId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="">No Requirement Assigned</option>
                {requirements.map((req) => (
                  <option key={req._id} value={req._id}>
                    {req.title} ({req.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Internal HR Evaluation Notes & Remarks
            </label>
            <textarea
              rows={3}
              value={hrEvaluationNotes}
              onChange={(e) => setHrEvaluationNotes(e.target.value)}
              placeholder="Record your verification observations, screening feedback, and notes for the departmental manager..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {evalSaveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Evaluation saved successfully!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSavingEvaluation}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                {isSavingEvaluation ? 'Saving...' : 'Save Evaluation'}
              </button>

              {hrReviewStatus === 'Suitable' && (
                <button
                  type="button"
                  onClick={() => navigate(`/hr/assignment?candidateId=${candidate._id}`)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Assign to Manager</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </section>

      {/* SECTION 8: RESUME DOCUMENT & EPHEMERAL STORAGE NOTICE */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Resume Document Content
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              const text = resumeData?.rawExtractedText || '';
              if (text) {
                navigator.clipboard.writeText(text);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
          </button>
        </div>

        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap select-all border border-slate-800">
          {resumeData?.rawExtractedText || 'No raw document text available for this record.'}
        </div>

        {/* Ephemeral Notice */}
        <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 border border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            Zero File Retention: The original PDF/DOCX file was parsed and immediately purged from disk. Candidate profile fields are securely preserved in MongoDB.
          </span>
        </div>
      </section>

      {/* FULL EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSavingEdit && setIsEditModalOpen(false)}
        title="Edit Candidate Information"
        subtitle="Update extracted fields. Changes are tracked with audit logs."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveFullEdit} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editForm.personalInformation?.fullName || ''}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    personalInformation: { ...editForm.personalInformation, fullName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                value={editForm.personalInformation?.email || ''}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    personalInformation: { ...editForm.personalInformation, email: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone</label>
              <input
                type="text"
                value={editForm.personalInformation?.phone || ''}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    personalInformation: { ...editForm.personalInformation, phone: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Location</label>
              <input
                type="text"
                value={editForm.personalInformation?.currentLocation || ''}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    personalInformation: { ...editForm.personalInformation, currentLocation: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Total Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={editForm.professionalInformation?.totalExperienceYears || ''}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    professionalInformation: {
                      ...editForm.professionalInformation,
                      totalExperienceYears: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Current Designation</label>
              <input
                type="text"
                value={editForm.professionalInformation?.currentDesignation || ''}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    professionalInformation: {
                      ...editForm.professionalInformation,
                      currentDesignation: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Professional Summary</label>
            <textarea
              rows={3}
              value={editForm.professionalInformation?.professionalSummary || ''}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  professionalInformation: {
                    ...editForm.professionalInformation,
                    professionalSummary: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSavingEdit}
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
            >
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
