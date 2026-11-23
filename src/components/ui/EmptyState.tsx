import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/60 dark:bg-[#111827]/60 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
