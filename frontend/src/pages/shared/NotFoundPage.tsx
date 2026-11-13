import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl font-bold mb-4 shadow-sm">
        404
      </div>
      <h1 className="text-xl font-extrabold text-slate-900">Page Not Found</h1>
      <p className="text-xs text-slate-500 mt-2 max-w-sm">
        The requested URL path does not exist or you may not have sufficient role permissions to access this view.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Home className="w-3.5 h-3.5" />
          Dashboard Home
        </button>
      </div>
    </div>
  );
};

