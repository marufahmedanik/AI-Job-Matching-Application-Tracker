import React, { useState } from 'react';
import { X, Link2, FileText, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { JobListing } from '../types';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobAdded: (job: JobListing) => void;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({ isOpen, onClose, onJobAdded }) => {
  const [activeTab, setActiveTab] = useState<'url' | 'paste'>('url');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('Bdjobs');
  const [rawDescription, setRawDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'url') {
        if (!url.trim()) {
          setError('Please provide a valid job URL.');
          setLoading(false);
          return;
        }
        const newJob = await api.importJob({
          url: url.trim(),
          source: url.includes('bdjobs') ? 'Bdjobs' : source,
        });
        onJobAdded(newJob);
        onClose();
      } else {
        if (!rawDescription.trim()) {
          setError('Please paste the job description text.');
          setLoading(false);
          return;
        }
        const newJob = await api.importJob({
          title: title.trim(),
          company: company.trim(),
          raw_description: rawDescription.trim(),
          source,
          url: url.trim() || undefined,
        });
        onJobAdded(newJob);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import job listing. Please try pasting the description manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Import Job Circular</h2>
            <p className="text-xs text-slate-400">Import via authorized link or paste description directly</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => { setActiveTab('url'); setError(null); }}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'url'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Import via URL (Bdjobs / Web)</span>
          </button>
          <button
            onClick={() => { setActiveTab('paste'); setError(null); }}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'paste'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Job Description</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {activeTab === 'url' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Job URL <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://jobs.bdjobs.com/jobdetails.asp?id=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
                💡 <strong>Tip:</strong> If Bdjobs blocks automated page fetching due to session protection, simply switch to the <em>"Paste Job Description"</em> tab to paste the requirements text directly.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Job Title <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software QA Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Company Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Brain Station 23 / Enosis"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source Platform</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Bdjobs">Bdjobs.com</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Company Portal">Company Portal</option>
                    <option value="Direct">Other / Direct</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Original Listing URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://jobs.bdjobs.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Job Description & Requirements <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste requirements, responsibilities, skills, and experience criteria here..."
                  value={rawDescription}
                  onChange={(e) => setRawDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-700/20 flex items-center gap-2 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Analyzing & Matching...' : 'Add & Match Job'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
