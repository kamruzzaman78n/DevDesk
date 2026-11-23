import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  Kanban,
  List,
  Plus,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import { isSafeHttpUrl } from '../lib/sanitize';
import type { PriorityLevel, ProjectItem, ProjectStatus, TaskItem, TaskStatus } from '../types/devdesk';

interface Props {
  initialItemId?: string;
  initialCreate?: boolean;
}

export const ProjectHubModule: React.FC<Props> = ({ initialItemId, initialCreate }) => {
  const { snapshot, updateSnapshot, pushToast } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(initialItemId || null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<PriorityLevel>('medium');
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);

  useEffect(() => {
    if (initialItemId) setSelectedId(initialItemId);
  }, [initialItemId]);

  const createProject = () => {
    const now = new Date().toISOString();
    const project: ProjectItem = {
      id: crypto.randomUUID(),
      name: 'New Project',
      description: '',
      status: 'active',
      priority: 'medium',
      techStack: [],
      startDate: now.slice(0, 10),
      createdAt: now,
      updatedAt: now,
    };
    updateSnapshot(
      (prev) => ({ ...prev, projects: [project, ...prev.projects] }),
      { type: 'project', action: 'Created project', title: project.name },
    );
    setSelectedId(project.id);
  };

  useEffect(() => {
    if (initialCreate) createProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCreate]);

  const selected = useMemo(
    () => snapshot.projects.find((p) => p.id === selectedId) || snapshot.projects[0] || null,
    [snapshot.projects, selectedId],
  );

  const projectTasks = useMemo(
    () => (selected ? snapshot.tasks.filter((t) => t.projectId === selected.id) : []),
    [snapshot.tasks, selected],
  );

  const progressPct = useMemo(() => {
    if (!projectTasks.length) return 0;
    const done = projectTasks.filter((t) => t.status === 'done').length;
    return Math.round((done / projectTasks.length) * 100);
  }, [projectTasks]);

  const patchProject = (id: string, patch: Partial<ProjectItem>) => {
    updateSnapshot((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !newTaskTitle.trim()) return;
    const now = new Date().toISOString();
    const task: TaskItem = {
      id: crypto.randomUUID(),
      projectId: selected.id,
      title: newTaskTitle.trim(),
      description: '',
      status: 'todo',
      priority: newTaskPriority,
      labels: [],
      createdAt: now,
      updatedAt: now,
    };
    updateSnapshot(
      (prev) => ({ ...prev, tasks: [task, ...prev.tasks] }),
      { type: 'task', action: 'Added task', title: task.title },
    );
    setNewTaskTitle('');
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    updateSnapshot(
      (prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t,
        ),
      }),
      status === 'done' ? { type: 'task', action: 'Completed task', title: snapshot.tasks.find((t) => t.id === taskId)?.title || 'Task' } : undefined,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Project Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize development projects and track completion across Kanban or List views.
          </p>
        </div>
        <button
          type="button"
          onClick={createProject}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {snapshot.projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to organize tech stack notes, repository links, and Todo / In Progress / Done tasks."
          actionLabel="Create First Project"
          onAction={createProject}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-200 dark:divide-slate-800">
            {snapshot.projects.map((p) => {
              const pTasks = snapshot.tasks.filter((t) => t.projectId === p.id);
              const done = pTasks.filter((t) => t.status === 'done').length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full p-3.5 text-left transition-colors cursor-pointer ${
                    selected?.id === p.id ? 'bg-indigo-600/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {p.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {p.status} · {done}/{pTasks.length} tasks
                  </div>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="lg:col-span-9 space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <input
                    type="text"
                    value={selected.name}
                    onChange={(e) => patchProject(selected.id, { name: e.target.value })}
                    className="flex-1 bg-transparent font-display text-lg font-semibold text-slate-900 dark:text-white focus:outline-none border-b border-transparent focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => setViewMode('kanban')}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                          viewMode === 'kanban' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        <Kanban className="w-3.5 h-3.5" />
                        <span>Kanban</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                          viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>List</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(selected)}
                      className="rounded-lg border border-red-500/30 p-2 text-red-500 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <select
                    value={selected.status}
                    onChange={(e) => patchProject(selected.id, { status: e.target.value as ProjectStatus })}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-2.5 py-1.5"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    value={selected.priority}
                    onChange={(e) => patchProject(selected.id, { priority: e.target.value as PriorityLevel })}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-2.5 py-1.5"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <input
                    type="date"
                    value={selected.dueDate || ''}
                    onChange={(e) => patchProject(selected.id, { dueDate: e.target.value })}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1.5"
                  />
                  <input
                    type="text"
                    value={selected.techStack.join(', ')}
                    onChange={(e) =>
                      patchProject(selected.id, {
                        techStack: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Stack (React, Postgres…)"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1.5"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input
                    type="url"
                    value={selected.repoUrl || ''}
                    onChange={(e) => patchProject(selected.id, { repoUrl: e.target.value })}
                    placeholder="Repository URL (https://…)"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5"
                  />
                  <input
                    type="url"
                    value={selected.liveUrl || ''}
                    onChange={(e) => patchProject(selected.id, { liveUrl: e.target.value })}
                    placeholder="Live Demo URL (https://…)"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5"
                  />
                </div>
                {(selected.repoUrl && isSafeHttpUrl(selected.repoUrl)) || (selected.liveUrl && isSafeHttpUrl(selected.liveUrl)) ? (
                  <div className="flex gap-4 text-xs">
                    {selected.repoUrl && isSafeHttpUrl(selected.repoUrl) && (
                      <a href={selected.repoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                        Open Repository
                      </a>
                    )}
                    {selected.liveUrl && isSafeHttpUrl(selected.liveUrl) && (
                      <a href={selected.liveUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                        Open Live URL
                      </a>
                    )}
                  </div>
                ) : null}

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1 tabular-nums">
                    <span>Task Progress</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>

              {/* Add Task */}
              <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a task to this project…"
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs"
                />
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as PriorityLevel)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
                >
                  Add Task
                </button>
              </form>

              {viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(
                    [
                      ['todo', 'Todo', Circle],
                      ['in-progress', 'In Progress', Clock],
                      ['done', 'Done', CheckCircle2],
                    ] as const
                  ).map(([colStatus, colLabel, Icon]) => {
                    const colTasks = projectTasks.filter((t) => t.status === colStatus);
                    return (
                      <div
                        key={colStatus}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{colLabel}</span>
                          </span>
                          <span className="tabular-nums text-slate-400">{colTasks.length}</span>
                        </div>
                        <div className="space-y-2">
                          {colTasks.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] p-3 space-y-2"
                            >
                              <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                {task.title}
                              </div>
                              <div className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="text-slate-500">{task.priority} priority</span>
                                <div className="flex items-center gap-1">
                                  <select
                                    aria-label={`Change status for ${task.title}`}
                                    value={task.status}
                                    onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                                    className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-1.5 py-0.5 text-[11px]"
                                  >
                                    <option value="todo">Todo</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="done">Done</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSnapshot((prev) => ({
                                        ...prev,
                                        tasks: prev.tasks.filter((x) => x.id !== task.id),
                                      }))
                                    }
                                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-200 dark:divide-slate-800">
                  {projectTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No tasks in this project yet.</div>
                  ) : (
                    projectTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{task.title}</div>
                          <div className="text-slate-500">{task.priority} priority</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-2 py-1 text-xs"
                          >
                            <option value="todo">Todo</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              updateSnapshot((prev) => ({
                                ...prev,
                                tasks: prev.tasks.filter((x) => x.id !== task.id),
                              }))
                            }
                            className="text-red-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Project?"
        description={`Delete "${deleteTarget?.name}" and all of its tasks?`}
        confirmLabel="Delete Project"
        onConfirm={() => {
          if (!deleteTarget) return;
          const removed = deleteTarget;
          updateSnapshot((prev) => ({
            ...prev,
            projects: prev.projects.filter((p) => p.id !== removed.id),
            tasks: prev.tasks.filter((t) => t.projectId !== removed.id),
          }));
          if (selected?.id === removed.id) setSelectedId(null);
          setDeleteTarget(null);
          pushToast('Project deleted.', 'info');
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
