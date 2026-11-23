import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unexpected workspace error.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F17] p-6">
          <div className="max-w-md w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-3">
            <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
            >
              Reload DevDesk
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
