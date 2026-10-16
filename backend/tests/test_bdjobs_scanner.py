import pytest
from unittest.mock import patch, MagicMock
import json
from fastapi.testclient import TestClient
from app.main import app
from app.bdjobs_scanner import BdjobsLiveScanner, clean_html_text

client = TestClient(app)

MOCK_BDJOBS_PAYLOAD = {
    "message": "Success",
    "statuscode": "1",
    "common": {
        "total_records_found": 2,
        "showd": "1",
        "totalpages": 1,
        "total_vacancies": 2
    },
    "data": [
        {
            "Jobid": "999001",
            "jobTitle": "Live Software QA Engineer",
            "companyName": "Tech Hub Bangladesh",
            "deadline": "Nov 28, 2026",
            "deadlineDB": "2026-11-28",
            "experience": "At least 1 years",
            "minExp": 1,
            "eduRec": "<p>B.Sc. in Computer Science and Engineering</p>",
            "jobContext": "<p>Responsible for manual testing, API testing with Postman, writing SQL queries and test cases.</p>",
            "location": "Dhaka"
        }
    ],
    "premiumData": [
        {
            "Jobid": "999002",
            "jobTitle": "Junior Python / FastAPI Developer",
            "companyName": "Dhaka Innovations",
            "deadline": "Dec 05, 2026",
            "deadlineDB": "2026-12-05",
            "experience": "0 to 1 years",
            "minExp": 0,
            "eduRec": "<p>B.Sc. in CSE or Software Engineering</p>",
            "jobContext": "<p>Building REST APIs using Python, FastAPI, Git, PostgreSQL.</p>",
            "location": "Dhaka"
        }
    ]
}


def test_clean_html_text():
    assert clean_html_text("<p>Hello <strong>World</strong></p>") == "Hello World"
    assert clean_html_text("") == ""
    assert clean_html_text(None) == ""


@patch("urllib.request.urlopen")
def test_bdjobs_scanner_fetch_page(mock_urlopen):
    mock_resp = MagicMock()
    mock_resp.read.return_value = json.dumps(MOCK_BDJOBS_PAYLOAD).encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp
    mock_urlopen.return_value = mock_resp

    page_data = BdjobsLiveScanner.fetch_page(category="8", keyword="QA", page=1, rpp=10)
    assert page_data["total_records"] == 2
    assert len(page_data["items"]) == 2
    
    first = page_data["items"][0]
    assert first["job_id"] == "999001"
    assert first["title"] == "Live Software QA Engineer"
    assert "Tech Hub Bangladesh" in first["company"]
    assert "Manual Testing" in first["required_skills"] or "SQL" in first["required_skills"]
    assert first["url"] == "https://jobs.bdjobs.com/jobdetails.asp?id=999001"


@patch("urllib.request.urlopen")
def test_sync_live_bdjobs_endpoint(mock_urlopen):
    mock_resp = MagicMock()
    mock_resp.read.return_value = json.dumps(MOCK_BDJOBS_PAYLOAD).encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp
    mock_urlopen.return_value = mock_resp

    res = client.post("/api/jobs/sync-live", json={
        "category": "8",
        "keyword": "QA",
        "max_pages": 1,
        "is_fresher": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["total_scanned"] == 2
    assert data["new_imported"] >= 1 or data["already_existing"] >= 1
    assert "top_matched_jobs" in data
