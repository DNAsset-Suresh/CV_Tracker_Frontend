import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, FileText, Users, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const data = await authService.login(email, password);
      if (data.success && data.token && data.user) {
        login(data.token, data.user);

        // Redirect based on role
        if (data.user.role === 'Admin') {
          navigate('/admin/dashboard');
        } else if (data.user.role === 'HR') {
          navigate('/hr/dashboard');
        } else if (data.user.role === 'Manager') {
          navigate('/manager/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setErrorMessage(data.message || 'Login failed');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Unable to connect to recruitment server. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 selection:bg-teal-500 selection:text-white">
      {/* Left Column: Enterprise Showcase & Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-teal-500/20">
              TF
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">TalentFlow AI</span>
              <span className="text-[11px] text-teal-400 font-medium">Enterprise Recruitment Suite</span>
            </div>
          </div>
        </div>

        {/* Center: Value Proposition & Feature Highlights */}
        <div className="relative z-10 space-y-6 my-auto py-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-4">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Role-Based Recruitment Platform
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Streamlined Hiring & Intelligent Candidate Allocation
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Screen resumes instantly, match candidates with departmental requirements, and collaborate across HR and Technical Managers in one unified platform.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Native Resume Extraction</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Instant parsing for PDF, DOCX, and scanned documents with zero third-party cloud data exposure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Role-Based Assignment</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Direct routing from HR recruiters to IT, Legal, and Field Executive managers with planned interview schedules.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Enterprise Security & Audit</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Strict RBAC enforcement, session isolation, and full audit logging for compliance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Footer notes */}
        <div className="relative z-10 pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>TalentFlow AI v2.4</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Role-Enforced RBAC
          </span>
        </div>
      </div>

      {/* Right Column: Authentication Form Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Branding (only visible on mobile/tablet) */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-teal-500/20">
              TF
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 block leading-tight">TalentFlow AI</span>
              <span className="text-[11px] text-slate-500">Recruitment Management</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-10">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your corporate credentials to access your recruitment workspace.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0"
                  />
                  <span className="text-xs text-slate-600">Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In to TalentFlow</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>256-bit TLS Encryption • Role-Enforced RBAC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
