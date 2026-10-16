import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import UserProfile, JobListing, JobApplication
from .schemas import (
    UserProfileResponse, UserProfileUpdate,
    JobListingResponse, JobListingCreate,
    JobApplicationResponse, JobApplicationUpdate,
    JobImportRequest
)
from .matcher import (
    calculate_match_score,
    extract_skills_from_text,
    extract_min_experience_from_text
)
from .parser import fetch_job_from_url, parse_job_text

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Job Matching & Application Tracker",
    description="Explainable AI matching engine for Bangladesh tech & SQA jobs (Bdjobs focus)",
    version="1.0.0"
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_or_create_default_profile(db: Session) -> UserProfile:
    profile = db.query(UserProfile).first()
    if not profile:
        profile = UserProfile(
            name="Candidate (CSE)",
            email="candidate@example.com",
            degree="B.Sc. in Computer Science and Engineering",
            target_role="Software QA Engineer",
            years_of_experience=1.0,
            skills="Java, SQL, Git, API Testing, Postman, Manual Testing, Bug Reporting, Jira",
            preferred_location="Dhaka, Bangladesh",
            raw_cv_text="Computer Science & Engineering graduate with 1 year experience in software quality assurance, manual testing, API testing with Postman, writing SQL queries, and bug reporting in Jira. Familiar with Git and basic Java."
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def parse_skills_string(skills_str: Optional[str]) -> List[str]:
    if not skills_str:
        return []
    try:
        loaded = json.loads(skills_str)
        if isinstance(loaded, list):
            return loaded
    except Exception:
        pass
    return [s.strip() for s in skills_str.split(",") if s.strip()]


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "AI Job Matcher & Tracker"}


# ---------------- Profile Endpoints ----------------
@app.get("/api/profile", response_model=UserProfileResponse)
def get_profile(db: Session = Depends(get_db)):
    profile = get_or_create_default_profile(db)
    skills_list = parse_skills_string(profile.skills)
    return UserProfileResponse(
        id=profile.id,
        name=profile.name,
        email=profile.email,
        degree=profile.degree,
        target_role=profile.target_role,
        years_of_experience=profile.years_of_experience,
        skills=skills_list,
        preferred_location=profile.preferred_location,
        raw_cv_text=profile.raw_cv_text,
        created_at=profile.created_at
    )


@app.put("/api/profile", response_model=UserProfileResponse)
def update_profile(data: UserProfileUpdate, db: Session = Depends(get_db)):
    profile = get_or_create_default_profile(db)

    if data.name is not None:
        profile.name = data.name
    if data.email is not None:
        profile.email = data.email
    if data.degree is not None:
        profile.degree = data.degree
    if data.target_role is not None:
        profile.target_role = data.target_role
    if data.years_of_experience is not None:
        profile.years_of_experience = data.years_of_experience
    if data.skills is not None:
        profile.skills = json.dumps(data.skills)
    if data.preferred_location is not None:
        profile.preferred_location = data.preferred_location
    if data.raw_cv_text is not None:
        profile.raw_cv_text = data.raw_cv_text
        # Re-extract skills if user updated raw CV
        extracted = extract_skills_from_text(data.raw_cv_text)
        current = parse_skills_string(profile.skills)
        combined = sorted(list(set(current + extracted)))
        profile.skills = json.dumps(combined)

    db.commit()
    db.refresh(profile)

    return UserProfileResponse(
        id=profile.id,
        name=profile.name,
        email=profile.email,
        degree=profile.degree,
        target_role=profile.target_role,
        years_of_experience=profile.years_of_experience,
        skills=parse_skills_string(profile.skills),
        preferred_location=profile.preferred_location,
        raw_cv_text=profile.raw_cv_text,
        created_at=profile.created_at
    )


@app.post("/api/profile/parse-cv")
def parse_cv_endpoint(payload: dict, db: Session = Depends(get_db)):
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="No CV text provided")

    extracted_skills = extract_skills_from_text(text)
    extracted_exp = extract_min_experience_from_text(text)

    return {
        "extracted_skills": extracted_skills,
        "extracted_experience": extracted_exp,
        "text_length": len(text)
    }


# ---------------- Job Endpoints ----------------
@app.get("/api/jobs", response_model=List[JobListingResponse])
def get_jobs(
    sort_by: str = Query("match", description="Sort by 'match', 'recent', or 'title'"),
    source: Optional[str] = None,
    db: Session = Depends(get_db)
):
    profile = get_or_create_default_profile(db)
    user_skills = parse_skills_string(profile.skills)

    query = db.query(JobListing)
    if source:
        query = query.filter(JobListing.source == source)

    jobs = query.all()

    # Get application status map
    applications = db.query(JobApplication).filter(JobApplication.user_id == profile.id).all()
    app_map = {a.job_id: a.status for a in applications}

    results = []
    for job in jobs:
        job_skills = parse_skills_string(job.required_skills)
        match_info = calculate_match_score(
            user_skills=user_skills,
            user_experience=profile.years_of_experience,
            user_target_role=profile.target_role,
            user_degree=profile.degree,
            job_required_skills=job_skills,
            job_min_experience=job.min_experience,
            job_title=job.title,
            job_education_req=job.education_req,
            job_raw_description=job.raw_description
        )

        results.append(JobListingResponse(
            id=job.id,
            title=job.title,
            company=job.company,
            location=job.location,
            job_type=job.job_type,
            source=job.source,
            url=job.url,
            deadline=job.deadline,
            min_experience=job.min_experience,
            education_req=job.education_req,
            required_skills=job_skills if job_skills else match_info["matched_skills"] + match_info["missing_skills_only"],
            raw_description=job.raw_description,
            created_at=job.created_at,
            match_score=float(match_info["total_score"]),
            matched_skills=match_info["matched_skills"],
            missing_skills=match_info["missing_skills"],
            score_breakdown=match_info["breakdown"],
            summary_explanation=match_info["summary"],
            application_status=app_map.get(job.id, None)
        ))

    if sort_by == "match":
        results.sort(key=lambda x: x.match_score or 0.0, reverse=True)
    elif sort_by == "recent":
        results.sort(key=lambda x: x.created_at, reverse=True)
    elif sort_by == "title":
        results.sort(key=lambda x: x.title.lower())

    return results


@app.post("/api/jobs/import", response_model=JobListingResponse)
async def import_job(payload: JobImportRequest, db: Session = Depends(get_db)):
    profile = get_or_create_default_profile(db)
    user_skills = parse_skills_string(profile.skills)

    # 1. Fetch from URL if URL provided and description empty
    if payload.url and not payload.raw_description:
        fetch_res = await fetch_job_from_url(payload.url)
        if not fetch_res.get("success"):
            raise HTTPException(status_code=400, detail=fetch_res.get("error", "Failed to fetch from URL"))
        
        parsed = {
            "title": payload.title or fetch_res.get("title"),
            "company": payload.company or fetch_res.get("company"),
            "url": payload.url,
            "source": payload.source or ("Bdjobs" if "bdjobs" in payload.url else "Web"),
            "min_experience": fetch_res.get("min_experience", 0.0),
            "required_skills": fetch_res.get("skills", []),
            "raw_description": fetch_res.get("raw_description", "")
        }
    elif payload.raw_description:
        parsed = parse_job_text(
            title=payload.title or "",
            company=payload.company or "",
            text=payload.raw_description,
            url=payload.url or "",
            source=payload.source or "Bdjobs"
        )
    else:
        raise HTTPException(status_code=400, detail="Please provide either a valid job URL or paste the job description text.")

    new_job = JobListing(
        title=parsed["title"],
        company=parsed["company"],
        location="Dhaka, Bangladesh",
        job_type="Full-time",
        source=parsed["source"],
        url=parsed.get("url"),
        deadline="Open",
        min_experience=parsed["min_experience"],
        education_req="B.Sc. in Computer Science or related degree",
        required_skills=json.dumps(parsed["required_skills"]),
        raw_description=parsed["raw_description"]
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Calculate match
    match_info = calculate_match_score(
        user_skills=user_skills,
        user_experience=profile.years_of_experience,
        user_target_role=profile.target_role,
        user_degree=profile.degree,
        job_required_skills=parsed["required_skills"],
        job_min_experience=new_job.min_experience,
        job_title=new_job.title,
        job_education_req=new_job.education_req,
        job_raw_description=new_job.raw_description
    )

    return JobListingResponse(
        id=new_job.id,
        title=new_job.title,
        company=new_job.company,
        location=new_job.location,
        job_type=new_job.job_type,
        source=new_job.source,
        url=new_job.url,
        deadline=new_job.deadline,
        min_experience=new_job.min_experience,
        education_req=new_job.education_req,
        required_skills=parsed["required_skills"],
        raw_description=new_job.raw_description,
        created_at=new_job.created_at,
        match_score=float(match_info["total_score"]),
        matched_skills=match_info["matched_skills"],
        missing_skills=match_info["missing_skills"],
        score_breakdown=match_info["breakdown"],
        summary_explanation=match_info["summary"],
        application_status=None
    )


@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobListing).filter(JobListing.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job listing deleted successfully"}


# ---------------- Application Tracking Endpoints ----------------
@app.get("/api/applications")
def get_applications(db: Session = Depends(get_db)):
    profile = get_or_create_default_profile(db)
    apps = db.query(JobApplication).filter(JobApplication.user_id == profile.id).all()

    result = []
    for app_item in apps:
        job = app_item.job
        job_skills = parse_skills_string(job.required_skills) if job else []
        result.append({
            "id": app_item.id,
            "job_id": app_item.job_id,
            "user_id": app_item.user_id,
            "status": app_item.status,
            "applied_date": app_item.applied_date,
            "notes": app_item.notes,
            "match_score": app_item.match_score,
            "matched_skills": parse_skills_string(app_item.matched_skills),
            "missing_skills": parse_skills_string(app_item.missing_skills),
            "score_breakdown": json.loads(app_item.score_breakdown) if app_item.score_breakdown else {},
            "created_at": app_item.created_at.isoformat() if app_item.created_at else None,
            "updated_at": app_item.updated_at.isoformat() if app_item.updated_at else None,
            "job": {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "source": job.source,
                "url": job.url,
                "deadline": job.deadline,
                "min_experience": job.min_experience,
                "required_skills": job_skills
            } if job else None
        })
    return result


@app.post("/api/applications")
def track_job_application(payload: dict, db: Session = Depends(get_db)):
    job_id = payload.get("job_id")
    status = payload.get("status", "SAVED")
    notes = payload.get("notes", "")

    profile = get_or_create_default_profile(db)
    job = db.query(JobListing).filter(JobListing.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if existing
    app_entry = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.user_id == profile.id
    ).first()

    user_skills = parse_skills_string(profile.skills)
    job_skills = parse_skills_string(job.required_skills)
    match_info = calculate_match_score(
        user_skills=user_skills,
        user_experience=profile.years_of_experience,
        user_target_role=profile.target_role,
        user_degree=profile.degree,
        job_required_skills=job_skills,
        job_min_experience=job.min_experience,
        job_title=job.title,
        job_education_req=job.education_req,
        job_raw_description=job.raw_description
    )

    if not app_entry:
        app_entry = JobApplication(
            job_id=job_id,
            user_id=profile.id,
            status=status,
            notes=notes,
            match_score=float(match_info["total_score"]),
            matched_skills=json.dumps(match_info["matched_skills"]),
            missing_skills=json.dumps(match_info["missing_skills"]),
            score_breakdown=json.dumps(match_info["breakdown"])
        )
        db.add(app_entry)
    else:
        app_entry.status = status
        if notes:
            app_entry.notes = notes
        app_entry.match_score = float(match_info["total_score"])
        app_entry.matched_skills = json.dumps(match_info["matched_skills"])
        app_entry.missing_skills = json.dumps(match_info["missing_skills"])
        app_entry.score_breakdown = json.dumps(match_info["breakdown"])

    db.commit()
    db.refresh(app_entry)
    return {"message": "Application status updated", "status": app_entry.status, "id": app_entry.id}


@app.patch("/api/applications/{app_id}")
def update_application_status(app_id: int, payload: JobApplicationUpdate, db: Session = Depends(get_db)):
    app_item = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app_item:
        raise HTTPException(status_code=404, detail="Application not found")

    app_item.status = payload.status
    if payload.applied_date is not None:
        app_item.applied_date = payload.applied_date
    if payload.notes is not None:
        app_item.notes = payload.notes

    db.commit()
    db.refresh(app_item)
    return {"message": "Updated successfully", "status": app_item.status}


@app.delete("/api/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app_item = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app_item:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app_item)
    db.commit()
    return {"message": "Application untracked"}


# ---------------- Seed Sample Data ----------------
@app.post("/api/seed")
def seed_database(db: Session = Depends(get_db)):
    from .seed_data import SEED_JOBS
    created_count = 0
    for item in SEED_JOBS:
        existing = db.query(JobListing).filter(JobListing.title == item["title"], JobListing.company == item["company"]).first()
        if not existing:
            job = JobListing(
                title=item["title"],
                company=item["company"],
                location=item.get("location", "Dhaka, Bangladesh"),
                job_type=item.get("job_type", "Full-time"),
                source=item.get("source", "Bdjobs"),
                url=item.get("url"),
                deadline=item.get("deadline", "30 Nov 2026"),
                min_experience=item.get("min_experience", 1.0),
                education_req=item.get("education_req", "B.Sc. in Computer Science or related degree"),
                required_skills=json.dumps(item.get("required_skills", [])),
                raw_description=item.get("raw_description", "")
            )
            db.add(job)
            created_count += 1
    db.commit()
    return {"message": f"Successfully seeded {created_count} jobs."}
