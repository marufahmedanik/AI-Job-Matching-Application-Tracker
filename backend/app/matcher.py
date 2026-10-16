import re
from typing import List, Dict, Any, Set, Tuple

# Comprehensive Canonical Skill Registry tailored for SQA & CSE
CANONICAL_SKILLS: Dict[str, List[str]] = {
    # Testing & SQA Core
    "Manual Testing": ["manual testing", "functional testing", "black box testing", "test execution"],
    "Automation Testing": ["automation testing", "test automation", "automated testing"],
    "API Testing": ["api testing", "rest api testing", "api test", "backend testing"],
    "Selenium": ["selenium", "selenium webdriver", "selenium grid"],
    "Playwright": ["playwright"],
    "Cypress": ["cypress"],
    "Postman": ["postman", "newman"],
    "JMeter": ["jmeter", "apache jmeter", "performance testing", "load testing"],
    "Pytest": ["pytest"],
    "JUnit": ["junit", "junit5", "junit4"],
    "TestNG": ["testng"],
    "Appium": ["appium", "mobile testing"],
    "Bug Reporting": ["bug reporting", "defect tracking", "defect lifecycle", "bug life cycle"],
    "Test Planning": ["test planning", "test plan", "test strategy", "test cases", "test scenarios", "test design"],
    "Jira": ["jira", "atlassian jira"],
    "TestRail": ["testrail", "zephyr"],
    "STLC": ["stlc", "software testing life cycle"],
    "SDLC": ["sdlc", "software development life cycle"],
    "Agile/Scrum": ["agile", "scrum", "sprint"],
    "Security Testing": ["security testing", "owasp", "penetration testing"],

    # Programming Languages
    "Java": ["java", "core java"],
    "Python": ["python", "python3"],
    "SQL": ["sql", "mysql", "postgresql", "postgres", "rdbms", "queries"],
    "JavaScript": ["javascript", "js", "es6"],
    "TypeScript": ["typescript", "ts"],
    "C#": ["c#", "csharp", ".net"],
    "C++": ["c++", "cpp"],
    "Bash/Shell": ["bash", "shell scripting", "powershell"],

    # DevOps & Tools
    "Git": ["git", "github", "gitlab", "version control"],
    "CI/CD": ["ci/cd", "continuous integration", "continuous deployment"],
    "Jenkins": ["jenkins"],
    "Docker": ["docker", "containerization"],
    "Linux": ["linux", "unix", "ubuntu"],
    
    # Web & Architecture
    "REST API": ["rest", "restful", "rest api", "json", "http"],
    "HTML/CSS": ["html", "html5", "css", "css3"],
}

def extract_skills_from_text(text: str) -> List[str]:
    """
    Extracts canonical skills from free-form text (resume or job description)
    using word boundary regex checks.
    """
    if not text:
        return []

    text_lower = f" {text.lower()} "
    found_skills: Set[str] = set()

    for canonical_name, aliases in CANONICAL_SKILLS.items():
        for alias in aliases:
            # Word boundary matching to prevent matching 'java' in 'javascript' or 'c' in 'css'
            pattern = r'(?<![a-zA-Z0-9_#+])' + re.escape(alias) + r'(?![a-zA-Z0-9_#+])'
            if re.search(pattern, text_lower):
                found_skills.add(canonical_name)
                break

    return sorted(list(found_skills))


def extract_min_experience_from_text(text: str) -> float:
    """
    Extracts minimum required years of experience from text if present.
    e.g., '1-3 years of experience', 'at least 2 years', 'minimum 1 year'
    """
    if not text:
        return 0.0

    patterns = [
        r'(?:minimum|at least|min\.?)\s*(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:year|yr)',
        r'(\d+(?:\.\d+)?)\s*(?:-|to)\s*\d+\s*(?:year|yr)',
        r'(\d+(?:\.\d+)?)\s*\+?\s*(?:year|yr)s?\s*(?:of\s+)?experience',
    ]

    for pat in patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                continue

    return 0.0


def calculate_match_score(
    user_skills: List[str],
    user_experience: float,
    user_target_role: str,
    user_degree: str,
    job_required_skills: List[str],
    job_min_experience: float,
    job_title: str,
    job_education_req: str,
    job_raw_description: str = ""
) -> Dict[str, Any]:
    """
    Computes an explainable match score out of 100 with clear breakdown:
    - Skills (50%)
    - Experience (25%)
    - Role Alignment (15%)
    - Education/Degree (10%)
    """
    # 1. Skills Matching (Weight: 50 points)
    # If explicit job required skills are empty, extract from raw description
    target_job_skills = set(job_required_skills)
    if not target_job_skills and job_raw_description:
        target_job_skills = set(extract_skills_from_text(job_raw_description))
    
    if not target_job_skills:
        # Fallback default core skills if none found
        target_job_skills = {"Manual Testing", "API Testing", "Bug Reporting", "SQL", "Git"}

    user_skills_set = set(user_skills)
    matched_skills = sorted(list(user_skills_set.intersection(target_job_skills)))
    missing_skills = sorted(list(target_job_skills.difference(user_skills_set)))

    skill_ratio = len(matched_skills) / len(target_job_skills) if target_job_skills else 1.0
    skill_score = skill_ratio * 50.0

    # 2. Experience Matching (Weight: 25 points)
    exp_gap = 0.0
    if job_min_experience <= 0.0 or user_experience >= job_min_experience:
        exp_score = 25.0
        exp_status = f"Meets or exceeds requirement ({user_experience:.1f} yrs vs {job_min_experience:.1f} yrs req)"
    else:
        exp_gap = job_min_experience - user_experience
        ratio = max(0.0, user_experience / job_min_experience)
        # Relevant experience gets proportional score with base credit
        exp_score = max(5.0, (0.35 + 0.65 * ratio) * 25.0) if user_experience > 0 else 5.0
        exp_status = f"{exp_gap:.1f} {'year' if exp_gap == 1.0 else 'years'} short of requirement ({job_min_experience:.1f} yrs req)"

    # Add experience to missing list if there's a significant gap
    missing_items = list(missing_skills)
    if exp_gap > 0:
        missing_items.append(f"{exp_gap:.0f} {'year' if int(exp_gap) == 1 else 'years'} of experience" if exp_gap.is_integer() else f"{exp_gap:.1f} years of experience")

    # 3. Role / Title Alignment (Weight: 15 points)
    role_score = 5.0
    norm_target = user_target_role.lower()
    norm_job_title = job_title.lower()

    # Check key domain terms
    domain_keywords = ["qa", "quality", "test", "tester", "sdet", "automation", "sqa", "engineer", "software"]
    shared_keywords = [kw for kw in domain_keywords if kw in norm_target and kw in norm_job_title]
    if shared_keywords:
        role_score = min(15.0, 7.0 + len(shared_keywords) * 3.0)
    elif any(kw in norm_job_title for kw in ["software", "cse", "engineer"]):
        role_score = 10.0

    # 4. Education / Degree Alignment (Weight: 10 points)
    edu_score = 5.0
    norm_user_edu = (user_degree or "").lower()
    norm_job_edu = (job_education_req or "").lower()

    tech_degrees = ["cse", "computer science", "software engineering", "information technology", "b.sc", "bachelor"]
    if any(deg in norm_user_edu for deg in tech_degrees):
        edu_score = 10.0
    elif not norm_job_edu or "any" in norm_job_edu:
        edu_score = 8.0

    # Calculate Total Score
    total_score = round(skill_score + exp_score + role_score + edu_score)
    total_score = max(0, min(100, total_score))

    breakdown = {
        "skills_score": round(skill_score, 1),
        "skills_max": 50,
        "experience_score": round(exp_score, 1),
        "experience_max": 25,
        "role_score": round(role_score, 1),
        "role_max": 15,
        "education_score": round(edu_score, 1),
        "education_max": 10,
        "experience_status": exp_status,
        "match_percentage_skills": round(skill_ratio * 100, 1),
    }

    # Summary sentence explanation
    if total_score >= 80:
        summary = f"Strong match ({total_score}/100). You meet most technical requirements ({len(matched_skills)}/{len(target_job_skills)} skills matched)."
    elif total_score >= 60:
        summary = f"Moderate match ({total_score}/100). Good foundation, but missing key skills like {', '.join(missing_skills[:3]) if missing_skills else 'experience'}."
    else:
        summary = f"Low match ({total_score}/100). Consider upskilling in {', '.join(missing_skills[:3]) if missing_skills else 'the required domains'} before applying."

    # Compute category radar data for chart visualization
    radar_data = compute_radar_breakdown(user_skills_set, target_job_skills)

    return {
        "total_score": total_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_items,
        "missing_skills_only": missing_skills,
        "breakdown": breakdown,
        "summary": summary,
        "radar_data": radar_data
    }


def compute_radar_breakdown(user_skills: Set[str], job_skills: Set[str]) -> List[Dict[str, Any]]:
    """
    Computes category-wise coverage percentages formatted for RadarChart visualization.
    """
    categories = {
        "Testing & Automation": {"Manual Testing", "Automation Testing", "API Testing", "Selenium", "Playwright", "Cypress", "Postman", "JMeter", "Pytest", "JUnit", "TestNG", "Appium"},
        "Languages & DB": {"Java", "Python", "SQL", "JavaScript", "TypeScript", "C#", "C++", "Bash/Shell", "REST API", "HTML/CSS"},
        "DevOps & Cloud": {"Git", "CI/CD", "Jenkins", "Docker", "Linux"},
        "Process & STLC": {"Bug Reporting", "Test Planning", "Jira", "TestRail", "STLC", "SDLC", "Agile/Scrum", "Security Testing"}
    }

    results = []
    for cat_name, cat_skills in categories.items():
        job_in_cat = cat_skills.intersection(job_skills)
        user_in_cat = cat_skills.intersection(user_skills)

        if job_in_cat:
            req_score = 100
            user_score = round((len(user_in_cat.intersection(job_in_cat)) / len(job_in_cat)) * 100)
        else:
            # Baseline if job doesn't explicitly require it
            req_score = 60
            user_score = min(100, len(user_in_cat) * 35)

        results.append({
            "subject": cat_name,
            "candidate": user_score,
            "required": req_score,
            "fullMark": 100
        })

    return results

