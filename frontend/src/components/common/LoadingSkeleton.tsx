import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-slate-100 rounded"
                style={{ width: `${Math.max(40, 100 / cols - 5)}%` }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-3 w-24 bg-slate-100 rounded"></div>
        <div className="h-8 w-8 bg-slate-100 rounded-lg"></div>
      </div>
      <div className="h-7 w-16 bg-slate-200 rounded mt-4"></div>
      <div className="h-3 w-32 bg-slate-100 rounded mt-2"></div>
    </div>
  );
};

