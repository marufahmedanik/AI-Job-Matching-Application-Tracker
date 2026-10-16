"""
Edge case and error handling tests for the AI Job Matcher API.
Tests boundary conditions, invalid inputs, and robustness.
"""
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
        return e.code, json.loads(e.read() or b"{}") 
    except Exception as e:
        return None, str(e)

results = []

# --- Edge Case 1: Import job with NO description and NO url ---
s, d = req("POST", "/jobs/import", {"title": "", "company": ""})
results.append(("EC1. Import empty job (expect 400)", s == 400, "http_status=" + str(s) + " detail=" + str(d.get("detail",""))))

# --- Edge Case 2: Get non-existent application ---
s, d = req("DELETE", "/applications/99999")
results.append(("EC2. Delete non-existent app (expect 404)", s == 404, "http_status=" + str(s)))

# --- Edge Case 3: Delete non-existent job ---
s, d = req("DELETE", "/jobs/99999")
results.append(("EC3. Delete non-existent job (expect 404)", s == 404, "http_status=" + str(s)))

# --- Edge Case 4: Update non-existent application ---
s, d = req("PATCH", "/applications/99999", {"status": "OFFERED"})
results.append(("EC4. Patch non-existent app (expect 404)", s == 404, "http_status=" + str(s)))

# --- Edge Case 5: Match score for zero-skill user ---
s, profile = req("PUT", "/profile", {"skills": [], "years_of_experience": 0.0})
s2, jobs_resp = req("GET", "/jobs?sort_by=match")
jobs = jobs_resp.get("items", []) if isinstance(jobs_resp, dict) else jobs_resp
all_low = all(j.get("match_score", 100) < 50 for j in jobs)
results.append(("EC5. Zero-skill user: all jobs score<50", all_low,
               "scores=" + str([round(j.get("match_score",0)) for j in jobs])))

# Restore full profile
req("PUT", "/profile", {
    "skills": ["Java","SQL","Git","API Testing","Postman","Manual Testing","Bug Reporting","Jira"],
    "years_of_experience": 1.0,
    "target_role": "Software QA Engineer"
})

# --- Edge Case 6: CV parsing with empty string ---
s, d = req("POST", "/profile/parse-cv", {"text": ""})
results.append(("EC6. CV parse empty string (expect 400)", s == 400, "http_status=" + str(s) + " detail=" + str(d.get("detail",""))))

# --- Edge Case 7: CV parsing with very long text (5000+ chars) ---
long_text = "Experienced Software QA Engineer with expertise in Selenium, Playwright, Pytest, API testing with Postman, SQL database validation, Git, Docker, CI/CD with Jenkins. " * 30
s, d = req("POST", "/profile/parse-cv", {"text": long_text})
extracted = d.get("extracted_skills", [])
results.append(("EC7. CV parse long text (>5000 chars)", s == 200 and len(extracted) > 5,
               "extracted " + str(len(extracted)) + " skills"))

# --- Edge Case 8: Double-seed should not create duplicates ---
req("POST", "/seed")
req("POST", "/seed")
s, jobs_resp2 = req("GET", "/jobs")
jobs = jobs_resp2.get("items", []) if isinstance(jobs_resp2, dict) else jobs_resp2
brain_count = sum(1 for j in jobs if "Brain Station" in j.get("company", ""))
results.append(("EC8. Double seed no duplicates", brain_count == 1,
               "Brain Station 23 count=" + str(brain_count) + " total=" + str(len(jobs))))

# --- Edge Case 9: Track same job twice (should update, not duplicate) ---
job_id = jobs[0]["id"]
req("POST", "/applications", {"job_id": job_id, "status": "SAVED"})
req("POST", "/applications", {"job_id": job_id, "status": "APPLIED"})
s2, app_list = req("GET", "/applications")
same_job_apps = [a for a in app_list if a.get("job_id") == job_id]
results.append(("EC9. Track same job twice = upsert (1 app)", len(same_job_apps) == 1,
               "app count for same job=" + str(len(same_job_apps)) + " status=" + str(same_job_apps[0].get("status") if same_job_apps else "N/A")))

# Cleanup
for a in app_list:
    req("DELETE", "/applications/" + str(a["id"]))

# --- Edge Case 10: Score with no job skills (raw description only) ---
s, new_job = req("POST", "/jobs/import", {
    "title": "Test Automation Engineer",
    "company": "Test Corp",
    "source": "Direct",
    "raw_description": "We need someone with Java, Selenium, SQL, API Testing, Git, Postman experience. Minimum 1 year."
})
fallback_score = new_job.get("match_score", 0)
fallback_matched = new_job.get("matched_skills", [])
ok = fallback_score > 50 and len(fallback_matched) > 2
results.append(("EC10. Score from raw description (no explicit skills)", ok,
               "score=" + str(round(fallback_score)) + " matched=" + str(fallback_matched)))
# Delete
if new_job.get("id"):
    req("DELETE", "/jobs/" + str(new_job["id"]))

# ---- Print summary ----
print()
print("=" * 90)
print("{:<50} {:<10} {}".format("EDGE CASE", "STATUS", "DETAILS"))
print("=" * 90)
passed = 0
failed = []
for name, ok, detail in results:
    status = "PASS" if ok else "FAIL"
    if ok: passed += 1
    else: failed.append(name)
    print("{:<50} {:<10} {}".format(name, status, detail[:70]))
print("=" * 90)
print("EDGE CASE RESULT: {}/{} passed".format(passed, len(results)))
if failed:
    print("FAILED:")
    for f in failed:
        print("  - " + f)
