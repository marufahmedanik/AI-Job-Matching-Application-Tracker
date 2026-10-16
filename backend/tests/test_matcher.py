import pytest
from app.matcher import (
    calculate_match_score,
    extract_skills_from_text,
    extract_min_experience_from_text
)


def test_extract_skills_from_text():
    sample_text = (
        "Looking for SQA engineer with strong knowledge of Selenium WebDriver, "
        "REST API testing using Postman, SQL queries, and Git. Experience with Jira required."
    )
    skills = extract_skills_from_text(sample_text)
    assert "Selenium" in skills
    assert "API Testing" in skills
    assert "Postman" in skills
    assert "SQL" in skills
    assert "Git" in skills
    assert "Jira" in skills
    # Ensure no false positives
    assert "Python" not in skills
    assert "Docker" not in skills


def test_extract_experience_from_text():
    assert extract_min_experience_from_text("Requires at least 2 years of experience") == 2.0
    assert extract_min_experience_from_text("Minimum 3+ yrs in software testing") == 3.0
    assert extract_min_experience_from_text("1-3 years experience") == 1.0
    assert extract_min_experience_from_text("Fresher / No prior experience required") == 0.0


def test_illustrative_user_example_82_match_score():
    """
    Validates the exact example from the user prompt:
    Software QA Engineer
    Illustrative match score: 82/100
    Matched: Java, SQL, Git, API testing
    Missing: Selenium, 1 year of experience
    """
    user_skills = ["Java", "SQL", "Git", "API Testing", "Postman", "Manual Testing"]
    user_experience = 1.0
    user_role = "Software QA Engineer"
    user_degree = "B.Sc. in Computer Science and Engineering"

    job_required_skills = ["Java", "SQL", "Git", "API Testing", "Selenium"]
    job_min_experience = 2.0
    job_title = "Software QA Engineer"
    job_education = "B.Sc. in Computer Science & Engineering"

    result = calculate_match_score(
        user_skills=user_skills,
        user_experience=user_experience,
        user_target_role=user_role,
        user_degree=user_degree,
        job_required_skills=job_required_skills,
        job_min_experience=job_min_experience,
        job_title=job_title,
        job_education_req=job_education
    )

    # Validate score
    assert result["total_score"] == 82, f"Expected 82, got {result['total_score']}"

    # Validate matched skills
    for expected_matched in ["Java", "SQL", "Git", "API Testing"]:
        assert expected_matched in result["matched_skills"]

    # Validate missing skills
    assert "Selenium" in result["missing_skills_only"]
    assert any("year" in s and "experience" in s for s in result["missing_skills"])


def test_perfect_match_score():
    """Validates candidate meeting all technical and experience requirements"""
    user_skills = ["Selenium", "Python", "SQL", "Git", "Pytest", "Manual Testing"]
    user_experience = 3.0
    user_role = "Software QA Engineer"
    user_degree = "B.Sc. in CSE"

    job_skills = ["Selenium", "Python", "SQL", "Git", "Pytest"]
    job_min_experience = 2.0

    result = calculate_match_score(
        user_skills=user_skills,
        user_experience=user_experience,
        user_target_role=user_role,
        user_degree=user_degree,
        job_required_skills=job_skills,
        job_min_experience=job_min_experience,
        job_title="Software QA Engineer",
        job_education_req="B.Sc. in Computer Science"
    )

    assert result["total_score"] >= 95
    assert len(result["missing_skills_only"]) == 0
