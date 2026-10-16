import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MatchScoreCard } from './components/MatchScoreCard';
import { ProfileEditor } from './components/ProfileEditor';
import { ApplicationKanban } from './components/ApplicationKanban';
import { AddJobModal } from './components/AddJobModal';
import { api } from './services/api';
import type { JobListing, UserProfile, JobApplication } from './types';
import {
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  CheckCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'kanban' | 'profile'>('jobs');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobsCount, setTotalJobsCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | '80' | '60'>('all');
  const [sortBy, setSortBy] = useState<'match' | 'recent' | 'title'>('match');

  const loadData = async () => {
    try {
      setLoading(true);
      const minScoreVal = scoreFilter === '80' ? 80 : scoreFilter === '60' ? 60 : undefined;

      const [fetchedProfile, paginatedData, fetchedApps] = await Promise.all([
        api.getProfile(),
        api.getJobs(page, pageSize, sortBy, undefined, minScoreVal),
        api.getApplications()
      ]);

      setProfile(fetchedProfile);
      setJobs(paginatedData.items || []);
      setTotalPages(paginatedData.total_pages || 1);
      setTotalJobsCount(paginatedData.total || 0);
      setApplications(fetchedApps);

      // If database is completely empty, seed sample jobs automatically once
      if (paginatedData.total === 0 && scoreFilter === 'all') {
        await handleSeed();
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, sortBy, scoreFilter]);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await api.seedDatabase();
      setPage(1);
      const paginatedData = await api.getJobs(1, pageSize, sortBy);
      setJobs(paginatedData.items || []);
      setTotalPages(paginatedData.total_pages || 1);
      setTotalJobsCount(paginatedData.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTrackJob = async (jobId: number, status: string) => {
    try {
      await api.trackApplication(jobId, status);
      const [paginatedData, updatedApps] = await Promise.all([
        api.getJobs(page, pageSize, sortBy),
        api.getApplications()
      ]);
      setJobs(paginatedData.items || []);
      setApplications(updatedApps);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJobAdded = (newJob: JobListing) => {
    setJobs([newJob, ...jobs]);
    setTotalJobsCount((prev) => prev + 1);
  };

  // Client search filter on current page items
  const displayJobs = jobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      (job.matched_skills && job.matched_skills.some((s) => s.toLowerCase().includes(query)))
    );
  });

  const highMatchCount = jobs.filter((j) => (j.match_score || 0) >= 80).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onSeed={handleSeed}
        isSeeding={isSeeding}
        totalJobs={totalJobsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Circulars In System</p>
              <p className="text-2xl font-extrabold text-white mt-1">{totalJobsCount}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Strong Matches (80%+)</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{highMatchCount}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Tracked Applications</p>
              <p className="text-2xl font-extrabold text-teal-400 mt-1">{applications.length}</p>
            </div>
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Target Role</p>
              <p className="text-sm font-bold text-white mt-1 truncate max-w-[180px]">
                {profile?.target_role || 'Software QA Engineer'}
              </p>
              <p className="text-[11px] text-slate-400">{profile?.years_of_experience || 1.0} yr exp · CSE</p>
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Tab 1: Ranked Jobs List */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Control Bar: Search & Filter */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by title, company, or skills (e.g. Selenium, SQL, Brain Station)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Score Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                <button
                  onClick={() => { setScoreFilter('all'); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    scoreFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({totalJobsCount})
                </button>
                <button
                  onClick={() => { setScoreFilter('80'); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    scoreFilter === '80'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  80%+ Strong Match
                </button>
                <button
                  onClick={() => { setScoreFilter('60'); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    scoreFilter === '60'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  60%+ Moderate
                </button>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="match">Highest Match Score</option>
                  <option value="recent">Most Recent</option>
                  <option value="title">Job Title</option>
                </select>
              </div>
            </div>

            {/* Compliance / Safe Usage Note */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Ethical & Direct Application Control:</strong> This system does not automate login or bypass Bdjobs security protections. Click <em>"Review & Apply on Bdjobs"</em> on any match card to view the official posting and submit your application with full human control.
              </div>
            </div>

            {/* Jobs Grid */}
            {displayJobs.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
                <p className="text-sm text-slate-400">No job circulars match your current filter.</p>
                <button
                  onClick={() => { setSearchQuery(''); setScoreFilter('all'); setPage(1); }}
                  className="mt-3 text-xs text-emerald-400 hover:underline"
                >
                  Reset search filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {displayJobs.map((job) => (
                  <MatchScoreCard
                    key={job.id}
                    job={job}
                    onTrack={(status) => handleTrackJob(job.id, status)}
                  />
                ))}
              </div>
            )}

            {/* Scalable Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs">
                <div className="text-slate-400">
                  Showing page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({totalJobsCount} total listings)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-7 h-7 rounded-lg font-semibold transition ${
                        page === i + 1
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Application Tracker Kanban */}
        {activeTab === 'kanban' && (
          <ApplicationKanban
            applications={applications}
            onRefresh={loadData}
          />
        )}

        {/* Tab 3: Candidate Profile */}
        {activeTab === 'profile' && profile && (
          <ProfileEditor
            profile={profile}
            onProfileUpdated={(updated) => {
              setProfile(updated);
              loadData();
            }}
          />
        )}
      </main>

      {/* Add Job / URL Modal */}
      <AddJobModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onJobAdded={handleJobAdded}
      />
    </div>
  );
};

export default App;
