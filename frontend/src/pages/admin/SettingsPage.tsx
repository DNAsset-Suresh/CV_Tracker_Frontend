import React from 'react';
import { Shield, Database, Cpu, HardDrive, FileText, Lock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System Infrastructure & Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Connected document processing engines, ephemeral storage policies, database parameters, and security policies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Document Engine Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Document Extraction & Matching Engine</h3>
              <p className="text-[11px] text-slate-400">pdf-parse • Mammoth • Tesseract.js</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 text-slate-600">
            <div><span className="font-semibold text-slate-700">Engine Type:</span> Rule-Based Deterministic NLP</div>
            <div><span className="font-semibold text-slate-700">Supported Formats:</span> PDF (pdf-parse), DOCX (Mammoth), Scanned/Image (Tesseract.js OCR)</div>
            <div><span className="font-semibold text-slate-700">External Dependencies:</span> None (No external AI APIs, zero external API costs)</div>
            <div><span className="font-semibold text-slate-700">Data Integrity:</span> Missing fields saved as null without hallucination</div>
          </div>
        </div>

        {/* Ephemeral Storage Policy */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Document Storage Policy</h3>
              <p className="text-[11px] text-slate-400">Ephemeral Ingestion & Zero-Retention</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 text-slate-600">
            <div><span className="font-semibold text-slate-700">Retention Policy:</span> Zero File Retention (Ephemeral)</div>
            <div><span className="font-semibold text-slate-700">Storage Lifecycle:</span> Temp cache during text extraction &rarr; Purged immediately</div>
            <div><span className="font-semibold text-slate-700">Cloud Storage:</span> No AWS S3 or external cloud storage required</div>
            <div><span className="font-semibold text-slate-700">Candidate Data:</span> Parsed records & text securely preserved in MongoDB</div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">MongoDB Database Cluster</h3>
              <p className="text-[11px] text-slate-400">Mongoose ODM & Aggregation Engine</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 text-slate-600">
            <div><span className="font-semibold text-slate-700">Collections:</span> users, candidates, resumes, requirements, assignments, feedback, interviews, notifications, activityLogs</div>
            <div><span className="font-semibold text-slate-700">Indexing:</span> Compound text, unique email, role indices</div>
            <div><span className="font-semibold text-slate-700">Data Persistence:</span> Permanent candidate and match records</div>
          </div>
        </div>

        {/* Security & RBAC */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Security & RBAC Enforcement</h3>
              <p className="text-[11px] text-slate-400">JWT, Bcrypt & Rate Limiter</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 text-slate-600">
            <div><span className="font-semibold text-slate-700">Roles:</span> Admin, HR, Manager</div>
            <div><span className="font-semibold text-slate-700">Manager Classifications:</span> Advocate, IT Development, Field Executive</div>
            <div><span className="font-semibold text-slate-700">Password Hashing:</span> Bcrypt (Salt rounds: 10)</div>
            <div><span className="font-semibold text-slate-700">Department Isolation:</span> Enforced at database and route levels</div>
          </div>
        </div>
      </div>
    </div>
  );
};
