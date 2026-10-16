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


def test_seed_and_get_jobs():
    # Seed
    seed_res = client.post("/api/seed")
    assert seed_res.status_code == 200

    # Get Jobs
    jobs_res = client.get("/api/jobs?sort_by=match")
    assert jobs_res.status_code == 200
    jobs = jobs_res.json()
    assert len(jobs) > 0

    first_job = jobs[0]
    assert "match_score" in first_job
    assert "matched_skills" in first_job
    assert "missing_skills" in first_job
    assert "score_breakdown" in first_job


def test_job_application_lifecycle():
    # Get a job id
    jobs = client.get("/api/jobs").json()
    assert len(jobs) > 0
    job_id = jobs[0]["id"]

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
