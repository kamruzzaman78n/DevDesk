import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'primary' | 'secondary' | 'compact';
  fallbackLabel?: string;
}

export const PWAInstallButton: React.FC<Props> = ({
  variant = 'secondary',
  fallbackLabel,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const baseClass =
    variant === 'primary'
      ? 'inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer'
      : variant === 'compact'
        ? 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer'
        : 'inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer';

  if (isInstallable) {
    return (
      <button type="button" onClick={install} className={baseClass}>
        <Download className="w-4 h-4" />
        <span>Install Web App</span>
      </button>
    );
  }

  if (isIOS || fallbackLabel) {
    return (
      <>
        <button type="button" onClick={() => setShowGuide(true)} className={baseClass}>
          <Smartphone className="w-4 h-4" />
          <span>{isIOS ? 'Install on iOS' : fallbackLabel || 'Install PWA Guide'}</span>
        </button>

        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
          >
            <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <h3 id="pwa-guide-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {isIOS ? 'Install DevDesk on iPhone / iPad' : 'Install DevDesk Web App (PWA)'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Close install guide"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {isIOS ? (
                <ol className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal pl-5">
                  <li>Open DevDesk in Safari on your iPhone or iPad.</li>
                  <li>Tap the <strong>Share</strong> icon in the Safari toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Confirm by tapping <strong>Add</strong> for standalone offline access.</li>
                </ol>
              ) : (
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <p>
                    DevDesk is configured as an installable Progressive Web App with offline IndexedDB storage and cached assets.
                  </p>
                  <ul className="space-y-1.5 list-disc pl-5">
                    <li><strong>Chrome / Edge (Desktop & Android):</strong> Click the install icon in the browser address bar or open the browser menu and select <em>Install DevDesk</em>.</li>
                    <li><strong>Safari (iOS / iPadOS):</strong> Tap <em>Share</em> then <em>Add to Home Screen</em>.</li>
                  </ul>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
