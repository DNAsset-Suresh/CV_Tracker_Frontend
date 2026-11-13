import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  UploadCloud,
  Layers,
  Sparkles,
  GitPullRequest,
  CheckSquare,
  BarChart3,
  History,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  // Define navigation by role
  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/candidates', label: 'All Candidates', icon: Layers },
    { to: '/admin/requirements', label: 'Job Requirements', icon: Briefcase },
    { to: '/admin/assignments', label: 'Assignments Overview', icon: GitPullRequest },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/admin/activity-logs', label: 'Activity Logs', icon: History },
  ];

  const hrLinks = [
    { to: '/hr/dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
    { to: '/hr/upload', label: 'Resume Upload', icon: UploadCloud },
    { to: '/hr/upload-history', label: 'Upload History', icon: History },
    { to: '/hr/candidates', label: 'Candidate Database', icon: Layers },
    { to: '/hr/requirements', label: 'Job Requirements', icon: Briefcase },
    { to: '/hr/screening', label: 'AI Resume Screening', icon: Sparkles },
    { to: '/hr/matching', label: 'Candidate Matching', icon: CheckSquare },
    { to: '/hr/assign', label: 'Manager Assignment', icon: GitPullRequest },
    { to: '/hr/assignments', label: 'Assignment History', icon: FileText },
    { to: '/hr/reports', label: 'Reports', icon: BarChart3 },
  ];

  const managerLinks = [
    { to: '/manager/dashboard', label: 'Manager Dashboard', icon: LayoutDashboard },
    { to: '/manager/candidates', label: 'Assigned Candidates', icon: Users },
    { to: '/manager/interviews', label: 'Interview Management', icon: Calendar },
    { to: '/manager/reports', label: 'Reports', icon: BarChart3 },
  ];

  let currentLinks = hrLinks;
  if (role === 'Admin') currentLinks = adminLinks;
  if (role === 'Manager') currentLinks = managerLinks;

  return (
    <aside className="w-64 bg-[#111827] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Logo & Name */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-extrabold shadow-md shadow-teal-500/20">
          TF
        </div>
        <div>
          <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1">
            TalentFlow <span className="text-teal-400 text-xs font-semibold">AI</span>
          </span>
          <span className="text-[10px] text-slate-400 block -mt-0.5 tracking-wider uppercase font-semibold">
            Enterprise SaaS
          </span>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-5 py-3.5 bg-[#1E293B]/60 border-b border-slate-800/80">
        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
          Active Workspace
        </div>
        <div className="flex items-center gap-2 mt-1">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            {role === 'Manager'
              ? user?.managerClassification || 'Department Manager'
              : `${role} Portal`}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {currentLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>TalentFlow v1.0</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Operational
          </span>
        </div>
      </div>
    </aside>
  );
};

