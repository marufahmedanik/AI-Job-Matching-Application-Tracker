import type { JobListing, UserProfile, JobApplication, PaginatedJobsResponse } from '../types';

const BASE_URL = '/api';

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  // Profile
  getProfile: async (): Promise<UserProfile> => {
    const res = await fetch(`${BASE_URL}/profile`);
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  parseCv: async (text: string) => {
    const res = await fetch(`${BASE_URL}/profile/parse-cv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to parse CV');
    return res.json();
  },

  uploadCvPdf: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/profile/upload-cv-pdf`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload and parse PDF CV');
    }
    return res.json();
  },

  // Jobs
  getJobs: async (
    page: number = 1,
    pageSize: number = 10,
    sortBy: 'match' | 'recent' | 'title' = 'match',
    source?: string,
    minScore?: number
  ): Promise<PaginatedJobsResponse> => {
    let url = `${BASE_URL}/jobs?page=${page}&page_size=${pageSize}&sort_by=${sortBy}`;
    if (source) url += `&source=${encodeURIComponent(source)}`;
    if (minScore !== undefined) url += `&min_score=${minScore}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  importJob: async (payload: { url?: string; title?: string; company?: string; raw_description?: string; source?: string }): Promise<JobListing> => {
    const res = await fetch(`${BASE_URL}/jobs/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to import job');
    }
    return res.json();
  },

  deleteJob: async (jobId: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete job');
  },

  seedDatabase: async () => {
    const res = await fetch(`${BASE_URL}/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed database');
    return res.json();
  },

  syncLiveJobs: async (category: string = "8", keyword: string = "", maxPages: number = 1, isFresher: boolean = false) => {
    const res = await fetch(`${BASE_URL}/jobs/sync-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, keyword, max_pages: maxPages, is_fresher: isFresher }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to scan live Bdjobs');
    }
    return res.json();
  },

  // Applications
  getApplications: async (): Promise<JobApplication[]> => {
    const res = await fetch(`${BASE_URL}/applications`);
    if (!res.ok) throw new Error('Failed to load applications');
    return res.json();
  },

  trackApplication: async (jobId: number, status: string = 'SAVED', notes: string = ''): Promise<any> => {
    const res = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, status, notes }),
    });
    if (!res.ok) throw new Error('Failed to track application');
    return res.json();
  },

  updateApplicationStatus: async (appId: number, status: string, notes?: string, appliedDate?: string) => {
    const res = await fetch(`${BASE_URL}/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes, applied_date: appliedDate }),
    });
    if (!res.ok) throw new Error('Failed to update application');
    return res.json();
  },

  deleteApplication: async (appId: number) => {
    const res = await fetch(`${BASE_URL}/applications/${appId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to untrack application');
  }
};
