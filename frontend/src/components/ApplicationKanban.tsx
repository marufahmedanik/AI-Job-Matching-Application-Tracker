import React, { useState } from 'react';
import { ExternalLink, Calendar, Trash2, Edit3, CheckCircle, Clock } from 'lucide-react';
import type { JobApplication } from '../types';
import { api } from '../services/api';

interface ApplicationKanbanProps {
  applications: JobApplication[];
  onRefresh: () => void;
}

const COLUMNS = [
  { id: 'SAVED', title: 'Wishlist / Saved', color: 'border-slate-700 bg-slate-900/60' },
  { id: 'APPLIED', title: 'Applied', color: 'border-blue-500/30 bg-blue-950/20' },
  { id: 'SCREENED', title: 'Screened / Task', color: 'border-purple-500/30 bg-purple-950/20' },
  { id: 'INTERVIEWING', title: 'Interviewing', color: 'border-amber-500/30 bg-amber-950/20' },
  { id: 'OFFERED', title: 'Offered 🎉', color: 'border-emerald-500/30 bg-emerald-950/20' },
  { id: 'REJECTED', title: 'Archived', color: 'border-rose-950/40 bg-slate-950/40' },
];

export const ApplicationKanban: React.FC<ApplicationKanbanProps> = ({ applications, onRefresh }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (appId: number, newStatus: string) => {
    try {
      await api.updateApplicationStatus(appId, newStatus);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (appId: number) => {
    if (!window.confirm('Untrack this application?')) return;
    try {
      await api.deleteApplication(appId);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async (appId: number, currentStatus: string) => {
    setUpdating(true);
    try {
      await api.updateApplicationStatus(appId, currentStatus, editNotes);
      setEditingId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tracker Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Application Tracker Board</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your applications from wishlist to interview offers. Remember to review and submit applications directly on Bdjobs.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl">
          Total tracked: <strong className="text-white">{applications.length}</strong>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((a) => a.status === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.color} p-3.5 min-h-[350px] flex flex-col`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                  {col.title}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                  {colApps.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colApps.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-[11px] text-slate-600 border border-dashed border-slate-800/80 rounded-xl">
                    No jobs
                  </div>
                ) : (
                  colApps.map((appItem) => {
                    const score = Math.round(appItem.match_score || 0);

                    return (
                      <div
                        key={appItem.id}
                        className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition space-y-2.5 text-xs"
                      >
                        {/* Title & Score */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-xs leading-snug line-clamp-2">
                              {appItem.job?.title || 'Job Listing'}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {appItem.job?.company}
                            </p>
                          </div>
                          <span
                            className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg flex-shrink-0 ${
                              score >= 80
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : score >= 60
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {score}%
                          </span>
                        </div>

                        {/* Status Mover Dropdown */}
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                            Move Stage
                          </label>
                          <select
                            value={appItem.status}
                            onChange={(e) => handleStatusChange(appItem.id, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            {COLUMNS.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Notes Section */}
                        {editingId === appItem.id ? (
                          <div className="space-y-1.5 pt-1">
                            <textarea
                              rows={2}
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Interview notes, HR contact, salary..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                            />
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveNotes(appItem.id, appItem.status)}
                                disabled={updating}
                                className="px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-600 text-white rounded-md"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group/notes flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                            <span className="line-clamp-1 italic">
                              {appItem.notes || 'Add notes...'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingId(appItem.id);
                                setEditNotes(appItem.notes || '');
                              }}
                              className="text-slate-500 hover:text-slate-300"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Footer Link & Delete */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          {appItem.job?.url ? (
                            <a
                              href={appItem.job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                            >
                              <span>Bdjobs Post</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500">Pasted</span>
                          )}

                          <button
                            onClick={() => handleDelete(appItem.id)}
                            className="text-slate-500 hover:text-rose-400 transition"
                            title="Untrack"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
