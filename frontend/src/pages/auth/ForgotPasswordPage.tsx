import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 sm:p-10">
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
            TF
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 block leading-tight">TalentFlow AI</span>
            <span className="text-[11px] text-slate-400">Account Recovery</span>
          </div>
        </div>

        {isSubmitted ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900">Reset Link Sent</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              If an account with <strong className="text-slate-800">{email}</strong> exists, password reset instructions have been dispatched.
            </p>
            <button
              onClick={() => navigate('/reset-password')}
              className="mt-6 w-full py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 shadow-sm"
            >
              Enter New Password
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-900">Forgot Password</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your work email address to receive password recovery instructions.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
              >
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
