import React, { useEffect, useState } from 'react';
import { Calendar, Video, Clock, CheckCircle2, XCircle, MapPin, ExternalLink } from 'lucide-react';
import { managerService } from '../../services/managerService';
import { StatusBadge } from '../../components/common/Badge';

export const InterviewManagementPage: React.FC = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      setIsLoading(true);
      try {
        const res = await managerService.getDashboard();
        if (res.success) {
          setInterviews(res.upcomingInterviews || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Interview Calendar & Schedules</h1>
        <p className="text-xs text-slate-500 mt-1">
          Technical, managerial, and final evaluation interview schedules with candidate join links.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Upcoming Interviews
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{interviews.length} Scheduled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Round Type</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Join / Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {interviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No upcoming interviews scheduled for your candidates.
                  </td>
                </tr>
              ) : (
                interviews.map((int: any) => (
                  <tr key={int._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {int.candidateId?.personalInformation?.fullName}
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {int.candidateId?.candidateId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {int.requirementId?.title}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {new Date(int.interviewDate).toLocaleString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                        {int.interviewType}
                      </span>
                    </td>
                    <td className="py-3 px-4">{int.mode}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={int.interviewStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {int.meetingLink ? (
                        <a
                          href={int.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meeting</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">{int.location || 'On-site'}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

