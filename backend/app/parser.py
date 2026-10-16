import re
import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any
from .matcher import extract_skills_from_text, extract_min_experience_from_text


async def fetch_job_from_url(url: str) -> Dict[str, Any]:
    """
    Attempts to fetch job title and description from an authorized URL or public job page.
    Falls back gracefully if the site is protected or blocks crawlers.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return {
                    "success": False,
                    "error": f"HTTP status {resp.status_code}. Site may require login or block direct access. Please paste job description manually.",
                    "url": url,
                }

            soup = BeautifulSoup(resp.text, "html.parser")

            # Remove unwanted tags
            for elem in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                elem.decompose()

            # Attempt to extract title
            page_title = soup.title.string.strip() if soup.title and soup.title.string else ""
            h1 = soup.find("h1")
            title = h1.get_text(strip=True) if h1 else page_title

            # Clean text
            raw_text = soup.get_text(separator="\n")
            cleaned_text = re.sub(r'\n\s*\n+', '\n\n', raw_text).strip()

            # Extract fields
            skills = extract_skills_from_text(cleaned_text)
            min_exp = extract_min_experience_from_text(cleaned_text)

            # Heuristic for company name
            company = "Company via Bdjobs"
            if "bdjobs" in url.lower():
                # Check for bdjobs specific company breadcrumb or headers
                comp_tag = soup.find("h2") or soup.find(class_=re.compile("company", re.I))
                if comp_tag:
                    company = comp_tag.get_text(strip=True)

            return {
                "success": True,
                "title": title[:180] or "Software QA Engineer",
                "company": company[:140],
                "url": url,
                "raw_description": cleaned_text[:5000],
                "skills": skills,
                "min_experience": min_exp,
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to retrieve URL ({str(e)}). Please paste the job description directly.",
            "url": url,
        }


def parse_job_text(title: str, company: str, text: str, url: str = "", source: str = "Bdjobs") -> Dict[str, Any]:
    """
    Parses a pasted job description and extracts structured metadata.
    """
    skills = extract_skills_from_text(text)
    min_exp = extract_min_experience_from_text(text)

    # Heuristic title if not provided
    if not title.strip():
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        title = lines[0][:150] if lines else "Software QA Engineer"

    # Default fallback company if not provided
    if not company.strip():
        company = "Tech Company (Bangladesh)"

    return {
        "title": title.strip(),
        "company": company.strip(),
        "url": url.strip() or None,
        "source": source,
        "min_experience": min_exp,
        "required_skills": skills,
        "raw_description": text.strip()
    }
