import re
import math
import json
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from .models import JobListing, UserProfile
from .matcher import extract_skills_from_text, calculate_match_score
from .parser import parse_deadline_info


def clean_html_text(raw_html: Optional[str]) -> str:
    """Removes HTML tags and normalizes whitespace."""
    if not raw_html:
        return ""
    try:
        soup = BeautifulSoup(raw_html, "html.parser")
        raw = soup.get_text(separator=" ")
        return re.sub(r'\s+', ' ', raw).strip()
    except Exception:
        # Fallback regex stripper
        raw = re.sub(r'<[^>]+>', ' ', raw_html)
        return re.sub(r'\s+', ' ', raw).strip()


class BdjobsLiveScanner:
    """
    Live job scanner for Bdjobs.com.
    Queries the official search and details services to retrieve active job postings,
    extracts requirements, and runs them through the explainable matching engine.
    """
    SEARCH_ENDPOINT = "https://api.bdjobs.com/Jobs/api/JobSearch/GetJobSearch"
    DEFAULT_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://bdjobs.com',
        'Referer': 'https://bdjobs.com/h/jobs'
    }

    @classmethod
    def fetch_page(
        cls,
        category: str = "8",           # Default 8 = IT & Telecommunication
        keyword: str = "",
        page: int = 1,
        rpp: int = 30,
        is_fresher: bool = False
    ) -> Dict[str, Any]:
        """
        Fetches one page of live jobs from Bdjobs.com.
        """
        params = {
            "Icat": "",
            "industry": "",
            "category": str(category) if category else "",
            "org": "",
            "jobNature": "",
            "Fcat": "",
            "location": "",
            "Qot": "",
            "jobType": "",
            "jobLevel": "",
            "postedWithin": "",
            "deadline": "",
            "keyword": keyword or "",
            "pg": str(page),
            "qAge": "",
            "Salary": "",
            "experience": "",
            "gender": "",
            "MExp": "",
            "genderB": "",
            "MPostings": "",
            "MCat": "",
            "version": "",
            "rpp": str(rpp),
            "Newspaper": "",
            "armyp": "",
            "QDisablePerson": "",
            "pwd": "",
            "workplace": "",
            "facilitiesForPWD": "",
            "SaveFilterList": "",
            "UserFilterName": "",
            "HUserFilterName": "",
            "earlyJobAccess": "",
            "isPro": "0",
            "ToggleJobs": "true",
            "isFresher": "true" if is_fresher else "false"
        }

        qs = urllib.parse.urlencode(params)
        url = f"{cls.SEARCH_ENDPOINT}?{qs}"

        req = urllib.request.Request(url, headers=cls.DEFAULT_HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            return {"error": f"Failed to connect to Bdjobs API: {str(e)}", "items": [], "total_records": 0}

        common = data.get("common") or {}
        total_records = common.get("total_records_found", 0)
        total_pages = common.get("totalpages", 1)

        raw_items = (data.get("data") or []) + (data.get("premiumData") or [])
        parsed_items = []

        for item in raw_items:
            job_id = str(item.get("Jobid") or "").strip()
            if not job_id:
                continue

            title = (item.get("jobTitle") or "Job Opening").strip()
            company = (item.get("companyName") or "Confidential Employer").strip()
            deadline = (item.get("deadline") or "").strip()
            location = (item.get("location") or "Dhaka, Bangladesh").strip()
            exp_str = item.get("experience") or ""

            edu_clean = clean_html_text(item.get("eduRec"))
            context_clean = clean_html_text(item.get("jobContext"))

            # Determine min experience
            min_exp = 0.0
            if item.get("minExp"):
                try:
                    min_exp = float(item["minExp"])
                except Exception:
                    pass
            elif exp_str and "year" in exp_str.lower():
                m = re.search(r'(\d+(?:\.\d+)?)', exp_str)
                if m:
                    min_exp = float(m.group(1))

            canonical_url = f"https://jobs.bdjobs.com/jobdetails.asp?id={job_id}"

            # Combine raw description text for skill extraction
            combined_desc = (
                f"{title} at {company}.\n"
                f"Education Requirements: {edu_clean}\n"
                f"Experience Required: {exp_str}\n"
                f"Job Context & Responsibilities: {context_clean}"
            )

            # Auto extract skills from live text
            extracted_skills = extract_skills_from_text(combined_desc)

            parsed_items.append({
                "job_id": job_id,
                "title": title,
                "company": company,
                "location": location,
                "job_type": "Full-time",
                "source": "Bdjobs",
                "url": canonical_url,
                "deadline": deadline,
                "min_experience": min_exp,
                "education_req": edu_clean[:250] if edu_clean else "B.Sc. in CSE / IT or relevant field",
                "required_skills": extracted_skills,
                "raw_description": combined_desc
            })

        return {
            "items": parsed_items,
            "total_records": total_records,
            "total_pages": total_pages,
            "page": page
        }

    @classmethod
    def sync_to_database(
        cls,
        db: Session,
        profile: UserProfile,
        category: str = "8",
        keyword: str = "",
        max_pages: int = 2,
        is_fresher: bool = False,
        min_score_filter: float = 0.0
    ) -> Dict[str, Any]:
        """
        Scans live Bdjobs listings across 1..max_pages, ingests new listings into the database,
        updates existing ones, and calculates explainable match scores for the candidate profile.
        """
        # Parse candidate skills
        candidate_skills = []
        if profile.skills:
            try:
                candidate_skills = json.loads(profile.skills)
                if not isinstance(candidate_skills, list):
                    candidate_skills = [s.strip() for s in profile.skills.split(",") if s.strip()]
            except Exception:
                candidate_skills = [s.strip() for s in profile.skills.split(",") if s.strip()]

        total_scanned = 0
        new_imported = 0
        already_existing = 0
        high_matches = 0
        synced_results = []

        for p in range(1, max_pages + 1):
            page_data = cls.fetch_page(
                category=category,
                keyword=keyword,
                page=p,
                rpp=30,
                is_fresher=is_fresher
            )

            items = page_data.get("items", [])
            if not items:
                break

            for item in items:
                total_scanned += 1
                job_url = item["url"]
                job_title = item["title"]
                job_company = item["company"]

                # Check if listing already exists in database
                existing = db.query(JobListing).filter(
                    (JobListing.url == job_url) |
                    ((JobListing.title == job_title) & (JobListing.company == job_company))
                ).first()

                if existing:
                    already_existing += 1
                    target_job = existing
                    # Update deadline if it was refreshed
                    if item.get("deadline") and existing.deadline != item["deadline"]:
                        existing.deadline = item["deadline"]
                else:
                    new_job = JobListing(
                        title=job_title,
                        company=job_company,
                        location=item.get("location", "Dhaka, Bangladesh"),
                        job_type=item.get("job_type", "Full-time"),
                        source="Bdjobs",
                        url=job_url,
                        deadline=item.get("deadline"),
                        min_experience=item.get("min_experience", 0.0),
                        education_req=item.get("education_req", "B.Sc. in CSE"),
                        required_skills=json.dumps(item.get("required_skills", [])),
                        raw_description=item.get("raw_description", "")
                    )
                    db.add(new_job)
                    db.flush()
                    new_imported += 1
                    target_job = new_job

                # Calculate match score for candidate
                match_result = calculate_match_score(
                    user_skills=candidate_skills,
                    user_experience=profile.years_of_experience or 0.5,
                    user_target_role=profile.target_role or "Software Engineer / SQA Engineer",
                    user_degree=profile.degree or "B.Sc. in CSE",
                    job_required_skills=item.get("required_skills", []),
                    job_min_experience=item.get("min_experience", 0.0),
                    job_title=job_title,
                    job_education_req=item.get("education_req", "B.Sc. in CSE"),
                    job_raw_description=item.get("raw_description", "")
                )

                score = match_result.get("total_score", 0.0)
                if score >= 80.0:
                    high_matches += 1

                if score >= min_score_filter:
                    days_remaining, dl_status = parse_deadline_info(target_job.deadline)
                    synced_results.append({
                        "id": target_job.id,
                        "title": target_job.title,
                        "company": target_job.company,
                        "url": target_job.url,
                        "match_score": score,
                        "deadline": target_job.deadline,
                        "deadline_status": dl_status,
                        "matched_skills": match_result.get("matched_skills", []),
                        "missing_skills": match_result.get("missing_skills", [])
                    })

        db.commit()

        # Sort results by match score descending
        synced_results.sort(key=lambda x: x["match_score"], reverse=True)

        return {
            "success": True,
            "category": category,
            "keyword": keyword,
            "total_scanned": total_scanned,
            "new_imported": new_imported,
            "already_existing": already_existing,
            "high_matches": high_matches,
            "top_matched_jobs": synced_results[:10]
        }
