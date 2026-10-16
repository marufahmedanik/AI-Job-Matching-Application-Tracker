export interface ScoreBreakdown {
  skills_score: number;
  skills_max: number;
  experience_score: number;
  experience_max: number;
  role_score: number;
  role_max: number;
  education_score: number;
  education_max: number;
  experience_status: string;
  match_percentage_skills: number;
}

export interface RadarItem {
  subject: string;
  candidate: number;
  required: number;
  fullMark: number;
}

export interface JobListing {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: string;
  source: string;
  url?: string | null;
  deadline?: string | null;
  min_experience: number;
  education_req: string;
  required_skills: string[];
  raw_description: string;
  created_at: string;
  match_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  score_breakdown?: ScoreBreakdown;
  summary_explanation?: string;
  application_status?: string | null;
  deadline_status?: 'EXPIRED' | 'EXPIRING_SOON' | 'ACTIVE' | 'OPEN' | null;
  days_until_deadline?: number | null;
  radar_data?: RadarItem[];
}

export interface PaginatedJobsResponse {
  items: JobListing[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UserProfile {
  id: number;
  name: string;
  email?: string;
  degree: string;
  target_role: string;
  years_of_experience: number;
  skills: string[];
  preferred_location: string;
  raw_cv_text?: string;
  created_at: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  user_id: number;
  status: 'SAVED' | 'APPLIED' | 'SCREENED' | 'INTERVIEWING' | 'OFFERED' | 'REJECTED';
  applied_date?: string | null;
  notes?: string | null;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  score_breakdown: ScoreBreakdown;
  created_at: string;
  updated_at: string;
  job?: JobListing;
}
