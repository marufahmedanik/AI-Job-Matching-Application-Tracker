from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class UserProfileBase(BaseModel):
    name: str = "Tariqul Islam"
    email: Optional[str] = "tariqul.cse@example.com"
    degree: str = "B.Sc. in Computer Science and Engineering"
    target_role: str = "Software QA Engineer"
    years_of_experience: float = 1.0
    skills: List[str] = ["Java", "SQL", "Git", "API Testing", "Postman", "Manual Testing", "Bug Reporting", "Jira"]
    preferred_location: str = "Dhaka, Bangladesh"
    raw_cv_text: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    degree: Optional[str] = None
    target_role: Optional[str] = None
    years_of_experience: Optional[float] = None
    skills: Optional[List[str]] = None
    preferred_location: Optional[str] = None
    raw_cv_text: Optional[str] = None


class UserProfileResponse(UserProfileBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class JobListingBase(BaseModel):
    title: str
    company: str
    location: str = "Dhaka, Bangladesh"
    job_type: str = "Full-time"
    source: str = "Bdjobs"
    url: Optional[str] = None
    deadline: Optional[str] = None
    min_experience: float = 0.0
    education_req: str = "B.Sc. in CSE or related discipline"
    required_skills: List[str] = []
    raw_description: str


class JobListingCreate(JobListingBase):
    pass


class JobListingResponse(JobListingBase):
    id: int
    created_at: datetime
    # Match data dynamically attached if user profile is known
    match_score: Optional[float] = None
    matched_skills: Optional[List[str]] = None
    missing_skills: Optional[List[str]] = None
    score_breakdown: Optional[Dict[str, Any]] = None
    summary_explanation: Optional[str] = None
    application_status: Optional[str] = None  # SAVED, APPLIED, etc. if application exists
    deadline_status: Optional[str] = None     # EXPIRED, EXPIRING_SOON, ACTIVE, OPEN
    days_until_deadline: Optional[int] = None
    radar_data: Optional[List[Dict[str, Any]]] = None  # Category radar comparison data
    model_config = ConfigDict(from_attributes=True)


class PaginatedJobsResponse(BaseModel):
    items: List[JobListingResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    model_config = ConfigDict(from_attributes=True)


class JobApplicationUpdate(BaseModel):
    status: str
    applied_date: Optional[str] = None
    notes: Optional[str] = None


class JobApplicationResponse(BaseModel):
    id: int
    job_id: int
    user_id: int
    status: str
    applied_date: Optional[str]
    notes: Optional[str]
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    score_breakdown: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    job: JobListingBase
    model_config = ConfigDict(from_attributes=True)


class JobImportRequest(BaseModel):
    url: Optional[str] = None
    title: Optional[str] = ""
    company: Optional[str] = ""
    raw_description: Optional[str] = ""
    source: str = "Bdjobs"
