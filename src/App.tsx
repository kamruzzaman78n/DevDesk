import React, { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorkspaceShell } from './components/WorkspaceShell';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import type { AppMode, WebsitePage } from './types/devdesk';
import { MarketingWebsite } from './website/MarketingWebsite';

const VALID_PAGES: WebsitePage[] = [
  'home',
  'features',
  'download',
  'docs',
  'changelog',
  'faq',
  'privacy',
  'terms',
  'support',
];

function parseInitialRoute(): { mode: AppMode; page: WebsitePage } {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/app' || path.startsWith('/app/')) {
    return { mode: 'workspace', page: 'home' };
  }
  const slug = path.slice(1) as WebsitePage;
  if (VALID_PAGES.includes(slug)) {
    return { mode: 'website', page: slug };
  }
  return { mode: 'website', page: 'home' };
}

const AppViewport: React.FC = () => {
  const initial = parseInitialRoute();
  const [mode, setMode] = useState<AppMode>(initial.mode);
  const [page, setPage] = useState<WebsitePage>(initial.page);
  const { toasts, dismissToast, isOnline } = useWorkspace();

  useEffect(() => {
    const onPopState = () => {
      const next = parseInitialRoute();
      setMode(next.mode);
      setPage(next.page);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const launchWorkspace = () => {
    setMode('workspace');
    window.history.pushState({}, '', '/app');
    window.scrollTo({ top: 0 });
  };

  const goToWebsite = (targetPage: WebsitePage = 'home') => {
    setMode('website');
    setPage(targetPage);
    window.history.pushState({}, '', targetPage === 'home' ? '/' : `/${targetPage}`);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      {mode === 'workspace' ? (
        <WorkspaceShell onGoToWebsite={() => goToWebsite('home')} />
      ) : (
        <MarketingWebsite
          activePage={page}
          onChangePage={(p) => {
            setPage(p);
            window.history.pushState({}, '', p === 'home' ? '/' : `/${p}`);
          }}
          onLaunchApp={launchWorkspace}
        />
      )}

      {/* Offline Mode Banner */}
      {!isOnline && (
        <div className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode — Local IndexedDB cache active</span>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-16 md:bottom-4 right-4 z-50 space-y-2 max-w-sm">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-lg"
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <WorkspaceProvider>
        <AppViewport />
      </WorkspaceProvider>
    </ErrorBoundary>
  );
}
