import fitz
import pytest
from app.parser import (
    extract_text_from_pdf_bytes,
    parse_deadline_info,
    parse_job_text
)


def test_extract_text_from_pdf_bytes():
    # Empty bytes returns empty string
    assert extract_text_from_pdf_bytes(b"") == ""

    # Generate a real PDF
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Software Engineer - Quality Assurance\nExperience with Java, SQL, and Postman.")
    pdf_bytes = doc.tobytes()
    doc.close()

    text = extract_text_from_pdf_bytes(pdf_bytes)
    assert "Software Engineer" in text
    assert "Java" in text
    assert "SQL" in text


def test_parse_deadline_info():
    # Open / continuous
    days, status = parse_deadline_info("Open")
    assert status == "OPEN"
    assert days is None

    days, status = parse_deadline_info(None)
    assert status == "OPEN"

    # Future date (e.g. 25 Dec 2026)
    days, status = parse_deadline_info("25 Dec 2026")
    assert days is not None
    assert status in ["ACTIVE", "EXPIRING_SOON"]

    # Past date
    days, status = parse_deadline_info("01 Jan 2020")
    assert days is not None
    assert days < 0
    assert status == "EXPIRED"


def test_parse_job_text():
    sample_text = """
    Software QA Automation Lead
    Enosis Solutions
    We need someone with 3+ years experience.
    Strong in Java, Selenium, Playwright, SQL, Docker, and CI/CD pipelines.
    """
    result = parse_job_text(
        title="Software QA Automation Lead",
        company="Enosis Solutions",
        text=sample_text,
        url="https://jobs.bdjobs.com/test",
        source="Bdjobs"
    )

    assert result["title"] == "Software QA Automation Lead"
    assert result["company"] == "Enosis Solutions"
    assert "Selenium" in result["required_skills"]
    assert "Playwright" in result["required_skills"]
    assert result["min_experience"] == 3.0
