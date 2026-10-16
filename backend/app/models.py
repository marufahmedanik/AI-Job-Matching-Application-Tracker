from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), default="Candidate")
    email = Column(String(120), nullable=True)
    degree = Column(String(200), default="B.Sc. in Computer Science and Engineering")
    target_role = Column(String(150), default="Software QA Engineer")
    years_of_experience = Column(Float, default=1.0)
    skills = Column(Text, default="Java, SQL, Git, API Testing, Postman, Manual Testing, Bug Reporting, Jira")
    preferred_location = Column(String(100), default="Dhaka, Bangladesh")
    raw_cv_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")


class JobListing(Base):
    __tablename__ = "job_listings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    company = Column(String(150), nullable=False)
    location = Column(String(150), default="Dhaka, Bangladesh")
    job_type = Column(String(50), default="Full-time")  # Full-time, Internship, Remote
    source = Column(String(50), default="Bdjobs")       # Bdjobs, LinkedIn, Direct
    url = Column(String(500), nullable=True)
    deadline = Column(String(50), nullable=True)
    min_experience = Column(Float, default=0.0)
    education_req = Column(String(200), default="B.Sc. in CSE / IT or relevant field")
    required_skills = Column(Text, default="")
    raw_description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_listings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    status = Column(String(50), default="SAVED")  # SAVED, APPLIED, SCREENED, INTERVIEWING, OFFERED, REJECTED
    applied_date = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    match_score = Column(Float, default=0.0)
    matched_skills = Column(Text, default="[]")       # JSON list
    missing_skills = Column(Text, default="[]")       # JSON list
    score_breakdown = Column(Text, default="{}")      # JSON object
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserProfile", back_populates="applications")
    job = relationship("JobListing", back_populates="applications")
