
import sys
import os
import json
# Add current directory to sys.path
sys.path.append(os.getcwd())

from matcher import main as matcher_main
from utils import extract_text_from_pdf, clean_text
from skills import extract_skills

# Mock Data
job_description = """
Java Developer
We are looking for a Java Developer with experience in Spring Boot, REST APIs, and Microservices.
Skills: Java, SQL, Hibernate, Maven, Git.
"""

# Find a resume to test
upload_dir = r"d:\ResumeShortlist\backend\uploads"
pdf_files = [f for f in os.listdir(upload_dir) if f.endswith('.pdf')]
if not pdf_files:
    print("No PDF found for debugging.")
    sys.exit(1)

test_pdf = os.path.join(upload_dir, pdf_files[-1]) # Take the latest
print(f"Debug: Testing with {test_pdf}")

# 1. Test Extraction
print("\n--- 1. Text Extraction ---")
text = extract_text_from_pdf(test_pdf)
print(f"Extracted Length: {len(text)}")
print(f"Sample (first 200 chars): {text[:200]}...")

# 2. Test Skills
print("\n--- 2. Skills Extraction ---")
cleaned = clean_text(text)
skills = extract_skills(cleaned)
print(f"Found Skills: {skills}")

# 3. Test Matcher (Mocking stdin)
print("\n--- 3. Running Matcher ---")
input_json = json.dumps({
    "job_description": job_description,
    "file_paths": [test_pdf]
})

# Redirect stdin/stdout to capture output
from io import StringIO
old_stdin = sys.stdin
sys.stdin = StringIO(input_json)

try:
    matcher_main()
except Exception as e:
    print(f"\nMatcher Crashed: {e}")
finally:
    sys.stdin = old_stdin
