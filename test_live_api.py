import urllib.request, json, sys

BASE = "http://127.0.0.1:8000/api"

def req(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=10) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return None, str(e)

results = []

# 1. Health check
s, d = req("GET", "/health")
results.append(("1. Health check", s == 200 and d.get("status") == "ok", "status=" + str(d.get("status"))))

# 2. Get profile (auto-creates)
s, d = req("GET", "/profile")
skill_preview = str(d.get("skills", [])[:3])
results.append(("2. Get profile (auto-create)", s == 200 and "skills" in d, "skills=" + skill_preview))

# 3. Update profile with SQA-focused skills
update_payload = {
    "target_role": "Software QA Engineer",
    "years_of_experience": 1.0,
    "degree": "B.Sc. in Computer Science and Engineering",
    "skills": ["Java","SQL","Git","API Testing","Postman","Manual Testing","Bug Reporting","Jira"]
}
s, d = req("PUT", "/profile", update_payload)
results.append(("3. Update profile", s == 200 and d.get("target_role") == "Software QA Engineer",
                "role=" + str(d.get("target_role")) + " exp=" + str(d.get("years_of_experience"))))

# 4. Seed database
s, d = req("POST", "/seed")
results.append(("4. Seed sample Bdjobs data", s == 200, str(d.get("message"))))

# 5. Get ranked jobs (sorted by match)
s, jobs_resp = req("GET", "/jobs?sort_by=match")
jobs = jobs_resp.get("items", []) if isinstance(jobs_resp, dict) else jobs_resp
results.append(("5. Get ranked jobs list", s == 200 and len(jobs) >= 5, str(len(jobs)) + " jobs returned"))

# 6. Validate illustrative example: Brain Station 23 = 82/100
brain = next((j for j in jobs if "Brain Station" in j.get("company", "")), None)
if brain:
    score = round(brain.get("match_score", 0))
    matched = brain.get("matched_skills", [])
    missing = brain.get("missing_skills", [])
    ok = score == 82 and "Java" in matched and "Selenium" in missing
    results.append(("6. Brain Station 23 score=82/100", ok,
        "score=" + str(score) + " matched=" + str(matched) + " missing=" + str(missing)))
else:
    results.append(("6. Brain Station 23 score=82/100", False, "Job not found"))

# 7. Enosis (fresher job) should score 100
enosis = next((j for j in jobs if "Enosis" in j.get("company", "")), None)
if enosis:
    escore = round(enosis.get("match_score", 0))
    results.append(("7. Enosis (fresher) score=100", escore == 100, "score=" + str(escore)))
else:
    results.append(("7. Enosis (fresher) score=100", False, "Job not found"))

# 8. Senior SDET role should score low (needs Playwright, CI/CD, Docker)
sdet = next((j for j in jobs if "SDET" in j.get("title", "") or "Senior" in j.get("title", "")), None)
if sdet:
    sscore = round(sdet.get("match_score", 0))
    smissing = sdet.get("missing_skills", [])
    ok = sscore < 70
    results.append(("8. Senior SDET low score (skill gaps)", ok, "score=" + str(sscore) + " missing=" + str(smissing[:3])))
else:
    results.append(("8. Senior SDET low score (skill gaps)", False, "Job not found"))

# 9. Jobs are in descending match order
scores_list = [j.get("match_score", 0) for j in jobs]
sorted_desc = sorted(scores_list, reverse=True)
results.append(("9. Jobs sorted descending by score", scores_list == sorted_desc,
               "scores=" + str([round(x) for x in scores_list])))

# 10. Track application: SAVED
job_id = jobs[0]["id"]
s, app_r = req("POST", "/applications", {"job_id": job_id, "status": "SAVED", "notes": "Priority application"})
app_id = app_r.get("id")
results.append(("10. Track application (SAVED)", s == 200 and app_r.get("status") == "SAVED", "app_id=" + str(app_id)))

# 11. Advance status to APPLIED
s, patch_r = req("PATCH", "/applications/" + str(app_id),
                 {"status": "APPLIED", "applied_date": "2026-10-16", "notes": "Submitted via Bdjobs"})
results.append(("11. Advance to APPLIED stage", s == 200 and patch_r.get("status") == "APPLIED",
               "status=" + str(patch_r.get("status"))))

# 12. List all applications
s, app_list = req("GET", "/applications")
has_applied = any(a.get("status") == "APPLIED" for a in app_list)
results.append(("12. List applications (has APPLIED)", s == 200 and has_applied and len(app_list) > 0,
               str(len(app_list)) + " tracked apps, APPLIED found=" + str(has_applied)))

# 13. CV text parsing endpoint
cv_text = "SQA Engineer with 3 years of experience in Selenium WebDriver, JMeter, Cypress, Python Pytest, Docker CI/CD pipelines, Postman API testing, and SQL database validation."
s, cv_r = req("POST", "/profile/parse-cv", {"text": cv_text})
extracted_count = len(cv_r.get("extracted_skills", []))
ok = s == 200 and extracted_count >= 5
results.append(("13. CV text skill extraction", ok,
               "extracted=" + str(cv_r.get("extracted_skills")) + " exp=" + str(cv_r.get("extracted_experience"))))

# 14. Import a pasted job description
paste_payload = {
    "title": "QA Automation Engineer",
    "company": "BJIT Group",
    "source": "Bdjobs",
    "raw_description": (
        "BJIT Group is hiring a QA Automation Engineer. "
        "Minimum 2 years experience required. "
        "Skills: Python, Playwright, Git, SQL, API Testing, Pytest, Docker. "
        "B.Sc. in CSE or SWE is mandatory."
    )
}
s, new_job = req("POST", "/jobs/import", paste_payload)
ns = new_job.get("match_score")
ok = s == 200 and ns is not None and len(new_job.get("matched_skills", [])) > 0
results.append(("14. Import pasted job + auto-match", ok,
               "score=" + str(ns) + " matched=" + str(new_job.get("matched_skills")) + " missing=" + str(new_job.get("missing_skills"))))

# 15. Delete application
s, del_r = req("DELETE", "/applications/" + str(app_id))
results.append(("15. Delete/untrack application", s == 200, str(del_r.get("message"))))

# 16. Delete the newly imported job
s, d = req("DELETE", "/jobs/" + str(new_job.get("id", 999)))
results.append(("16. Delete job listing", s == 200, str(d.get("message"))))

# 17. Filter by source
s, bdjobs_resp = req("GET", "/jobs?sort_by=match&source=Bdjobs")
bdjobs_filtered = bdjobs_resp.get("items", []) if isinstance(bdjobs_resp, dict) else bdjobs_resp
results.append(("17. Filter jobs by source=Bdjobs", s == 200 and all(j.get("source") == "Bdjobs" for j in bdjobs_filtered),
               str(len(bdjobs_filtered)) + " Bdjobs listings"))

# 18. Sort by title
s, by_title_resp = req("GET", "/jobs?sort_by=title")
by_title = by_title_resp.get("items", []) if isinstance(by_title_resp, dict) else by_title_resp
titles = [j["title"] for j in by_title]
results.append(("18. Sort by title (alphabetical)", s == 200 and titles == sorted(titles, key=str.lower),
               "first=" + (titles[0] if titles else "N/A")))

# ---- Print report ----
print()
print("=" * 90)
print("{:<45} {:<10} {}".format("TEST CASE", "STATUS", "DETAILS"))
print("=" * 90)
passed = 0
failed = []
for name, ok, detail in results:
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed.append(name)
    print("{:<45} {:<10} {}".format(name, status, detail[:80]))

print("=" * 90)
print("RESULT: {}/{} tests passed".format(passed, len(results)))
if failed:
    print("FAILED:")
    for f in failed:
        print("  - " + f)
