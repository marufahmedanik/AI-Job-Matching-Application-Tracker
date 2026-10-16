import io
import fitz
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_and_update_profile():
    # GET
    res = client.get("/api/profile")
    assert res.status_code == 200
    data = res.json()
    assert "degree" in data
    assert "skills" in data

    # PUT
    update_data = {
        "target_role": "Software QA Automation Specialist",
        "years_of_experience": 2.0,
        "skills": ["Python", "Selenium", "SQL", "Git", "Playwright"]
    }
    res_put = client.put("/api/profile", json=update_data)
    assert res_put.status_code == 200
    updated = res_put.json()
    assert updated["target_role"] == "Software QA Automation Specialist"
    assert "Playwright" in updated["skills"]


def test_seed_and_paginated_jobs():
    # Seed
    seed_res = client.post("/api/seed")
    assert seed_res.status_code == 200

    # Get Jobs (Page 1, page_size=2)
    jobs_res = client.get("/api/jobs?page=1&page_size=2&sort_by=match")
    assert jobs_res.status_code == 200
    data = jobs_res.json()
    assert "items" in data
    assert "total" in data
    assert "total_pages" in data
    assert len(data["items"]) == 2
    assert data["total"] >= 5
    assert data["total_pages"] >= 3
    assert data["has_next"] is True
    assert data["has_prev"] is False

    # Check match score, radar data, and deadline info
    first_job = data["items"][0]
    assert "match_score" in first_job
    assert "matched_skills" in first_job
    assert "missing_skills" in first_job
    assert "score_breakdown" in first_job
    assert "deadline_status" in first_job
    assert "radar_data" in first_job
    assert len(first_job["radar_data"]) > 0


def test_duplicate_job_detection():
    job_payload = {
        "title": "Senior Automation Engineer",
        "company": "Kona Tech",
        "source": "Bdjobs",
        "raw_description": "Requires 3+ years experience with Playwright, Python, Docker, CI/CD, and SQL."
    }

    # First import: should succeed
    res1 = client.post("/api/jobs/import", json=job_payload)
    assert res1.status_code == 200
    created_id = res1.json()["id"]

    # Second import with same title & company: should raise 409 Conflict
    res2 = client.post("/api/jobs/import", json=job_payload)
    assert res2.status_code == 409
    assert "Duplicate job" in res2.json()["detail"]

    # Clean up
    client.delete(f"/api/jobs/{created_id}")


def test_upload_cv_pdf():
    # Generate an in-memory PDF using PyMuPDF
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (50, 72),
        "John Doe\nSQA Engineer\n"
        "Experience: 2 years in software quality assurance.\n"
        "Skills: Selenium WebDriver, Playwright, Python, Pytest, SQL, Git, Postman API Testing."
    )
    pdf_bytes = doc.tobytes()
    doc.close()

    # Upload via testclient multipart
    files = {"file": ("resume.pdf", pdf_bytes, "application/pdf")}
    res = client.post("/api/profile/upload-cv-pdf", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "Playwright" in data["extracted_skills"]
    assert "Selenium" in data["extracted_skills"]


def test_job_application_lifecycle():
    # Get a job id
    jobs_data = client.get("/api/jobs").json()
    assert len(jobs_data["items"]) > 0
    job_id = jobs_data["items"][0]["id"]

    # Save to Wishlist
    app_res = client.post("/api/applications", json={"job_id": job_id, "status": "SAVED", "notes": "Target for this month"})
    assert app_res.status_code == 200
    app_id = app_res.json()["id"]

    # Update to APPLIED
    patch_res = client.patch(f"/api/applications/{app_id}", json={"status": "APPLIED", "applied_date": "2026-10-16"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "APPLIED"

    # List applications
    all_apps = client.get("/api/applications").json()
    matching_app = next((a for a in all_apps if a["id"] == app_id), None)
    assert matching_app is not None
    assert matching_app["status"] == "APPLIED"

    # Delete application
    del_res = client.delete(f"/api/applications/{app_id}")
    assert del_res.status_code == 200
