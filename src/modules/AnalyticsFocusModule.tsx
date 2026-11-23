import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const PRESETS = [
  { id: '25-5', label: 'Pomodoro 25/5', minutes: 25 },
  { id: '50-10', label: 'Deep Work 50/10', minutes: 50 },
  { id: '15-3', label: 'Sprint 15/3', minutes: 15 },
];

export const AnalyticsFocusModule: React.FC = () => {
  const { snapshot, updateSnapshot, updatePreferences, pushToast } = useWorkspace();
  const [presetName, setPresetName] = useState('Pomodoro 25/5');
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const endTimestampRef = useRef<number | null>(null);
  const startedAtRef = useRef<string | null>(null);

  const playChime = () => {
    if (!snapshot.preferences.focusSoundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Ignore audio restrictions
    }
  };

  const recordCompletedSession = (minsCompleted: number, fullCompleted: boolean) => {
    const nowIso = new Date().toISOString();
    const startIso = startedAtRef.current || nowIso;
    updateSnapshot(
      (prev) => ({
        ...prev,
        focusSessions: [
          {
            id: crypto.randomUUID(),
            presetName,
            plannedMinutes,
            completedMinutes: Math.max(1, minsCompleted),
            completed: fullCompleted,
            startedAt: startIso,
            endedAt: nowIso,
          },
          ...prev.focusSessions,
        ],
      }),
      { type: 'focus', action: 'Completed focus session', title: `${presetName} (${minsCompleted}m)` },
    );
  };

  // Drift-free timestamp countdown even when tab is minimized
  useEffect(() => {
    if (!running) return;
    if (!endTimestampRef.current) {
      endTimestampRef.current = Date.now() + remainingSeconds * 1000;
    }
    const id = window.setInterval(() => {
      if (!endTimestampRef.current) return;
      const diffSec = Math.max(0, Math.ceil((endTimestampRef.current - Date.now()) / 1000));
      setRemainingSeconds(diffSec);
      if (diffSec === 0) {
        window.clearInterval(id);
        setRunning(false);
        endTimestampRef.current = null;
        playChime();
        recordCompletedSession(plannedMinutes, true);
        pushToast(`Focus session complete (${plannedMinutes} min).`, 'success');
        if (
          snapshot.preferences.focusNotificationsEnabled &&
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          new Notification('DevDesk Focus Timer', {
            body: `${presetName} (${plannedMinutes}m) completed.`,
          });
        }
      }
    }, 500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const selectPreset = (name: string, mins: number) => {
    setRunning(false);
    endTimestampRef.current = null;
    startedAtRef.current = null;
    setPresetName(name);
    setPlannedMinutes(mins);
    setRemainingSeconds(mins * 60);
  };

  const toggleRun = () => {
    if (running) {
      setRunning(false);
      endTimestampRef.current = null;
    } else {
      if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
      endTimestampRef.current = Date.now() + remainingSeconds * 1000;
      setRunning(true);
    }
  };

  const resetTimer = () => {
    setRunning(false);
    endTimestampRef.current = null;
    startedAtRef.current = null;
    setRemainingSeconds(plannedMinutes * 60);
  };

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') {
      pushToast('Browser notifications are not supported in this browser.', 'warning');
      return;
    }
    const perm = await Notification.requestPermission();
    updatePreferences({ focusNotificationsEnabled: perm === 'granted' });
    pushToast(
      perm === 'granted' ? 'Focus notifications enabled.' : 'Notification permission denied.',
      perm === 'granted' ? 'success' : 'warning',
    );
  };

  const mins = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const secs = String(remainingSeconds % 60).padStart(2, '0');

  const totalFocusMinutes = snapshot.focusSessions.reduce((s, f) => s + f.completedMinutes, 0);
  const doneTasks = snapshot.tasks.filter((t) => t.status === 'done').length;

  // Build real 28-day activity counts from real timestamps
  const heatmapDays = useMemo(() => {
    const counts = new Map<string, number>();
    const bump = (iso?: string) => {
      if (!iso) return;
      const key = iso.slice(0, 10);
      counts.set(key, (counts.get(key) || 0) + 1);
    };
    snapshot.snippets.forEach((s) => bump(s.createdAt));
    snapshot.notes.forEach((n) => bump(n.createdAt));
    snapshot.errors.forEach((e) => bump(e.createdAt));
    snapshot.focusSessions.forEach((f) => bump(f.endedAt));
    snapshot.tasks.filter((t) => t.status === 'done').forEach((t) => bump(t.updatedAt));

    const days: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
      days.push({ date: d, count: counts.get(d) || 0 });
    }
    return days;
  }, [snapshot]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Dev Analytics & Focus
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Timer-tracked focus sessions and activity visualizations derived strictly from your recorded workspace actions.
        </p>
      </div>

      {/* Real Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Focus Sessions', snapshot.focusSessions.length],
          ['Focus Minutes', totalFocusMinutes],
          ['Snippets + Notes', snapshot.snippets.length + snapshot.notes.length],
          ['Completed Tasks', doneTasks],
        ].map(([label, val]) => (
          <div key={String(label)} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
            <div className="mt-1 font-display text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {val}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Focus Timer */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Focus Timer
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updatePreferences({ focusSoundEnabled: !snapshot.preferences.focusSoundEnabled })}
                title="Toggle completion chime"
                className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-500 cursor-pointer"
              >
                {snapshot.preferences.focusSoundEnabled ? (
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={requestNotifications}
                title="Browser notifications"
                className={`rounded-lg border px-2.5 py-1.5 text-xs inline-flex items-center gap-1 cursor-pointer ${
                  snapshot.preferences.focusNotificationsEnabled
                    ? 'border-indigo-500 text-indigo-500'
                    : 'border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{snapshot.preferences.focusNotificationsEnabled ? 'Alerts On' : 'Enable Alerts'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPreset(p.label, p.minutes)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  presetName === p.label
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={180}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => selectPreset(`Custom ${customMinutes}m`, customMinutes)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs cursor-pointer"
              >
                Set
              </button>
            </div>
          </div>

          <div className="py-4 text-center">
            <div className="font-mono text-5xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">
              {mins}:{secs}
            </div>
            <div className="mt-1 text-xs text-slate-500">{presetName}</div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleRun}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 cursor-pointer"
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{running ? 'Pause' : remainingSeconds < plannedMinutes * 60 ? 'Resume' : 'Start'}</span>
            </button>
            <button
              type="button"
              onClick={resetTimer}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 28-Day Real Activity Heatmap + Session Log */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              28-Day Recorded Activity
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {heatmapDays.map((d) => {
                const intensity =
                  d.count === 0
                    ? 'bg-slate-200 dark:bg-slate-800'
                    : d.count === 1
                      ? 'bg-indigo-500/40'
                      : d.count <= 3
                        ? 'bg-indigo-500/70'
                        : 'bg-indigo-500';
                return (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count} recorded action(s)`}
                    className={`h-7 rounded-md ${intensity} flex items-center justify-center text-[10px] font-mono tabular-nums text-white/90`}
                  >
                    {d.count > 0 ? d.count : ''}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Session History
            </h2>
            {snapshot.focusSessions.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No completed focus sessions recorded yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800 max-h-48 overflow-y-auto text-xs">
                {snapshot.focusSessions.slice(0, 10).map((s) => (
                  <div key={s.id} className="py-2 flex items-center justify-between">
                    <span>{s.presetName}</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {s.completedMinutes} min · {new Date(s.endedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
