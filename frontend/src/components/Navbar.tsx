import React from 'react';
import { Briefcase, UserCheck, Kanban, PlusCircle, Sparkles, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: 'jobs' | 'kanban' | 'profile';
  setActiveTab: (tab: 'jobs' | 'kanban' | 'profile') => void;
  onOpenAddModal: () => void;
  onSeed: () => void;
  isSeeding: boolean;
  totalJobs: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onSeed,
  isSeeding,
  totalJobs
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Bdjobs AI Matcher</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  SQA & CSE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Explainable Job Matching & Application Tracker</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'jobs'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Ranked Jobs</span>
              {totalJobs > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {totalJobs}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'kanban'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Tracker Board</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>My CV Profile</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSeed}
              disabled={isSeeding}
              title="Reload sample Bdjobs postings"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>Load Bdjobs Seed</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-md shadow-emerald-700/20 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Job / URL</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
