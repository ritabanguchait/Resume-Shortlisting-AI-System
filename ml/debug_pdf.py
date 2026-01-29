
import sys
import os
sys.path.append(os.getcwd())
from utils import extract_text_from_pdf, clean_text
from skills import extract_skills

# Find latest PDF
upload_dir = r"d:\ResumeShortlist\backend\uploads"
pdf_files = [os.path.join(upload_dir, f) for f in os.listdir(upload_dir) if f.endswith('.pdf')]
if not pdf_files:
    print("No PDF found")
    sys.exit(1)

latest_pdf = max(pdf_files, key=os.path.getctime)
print(f"Debug: Testing latest PDF: {latest_pdf}")

text = extract_text_from_pdf(latest_pdf)
print(f"Extracted Length: {len(text)}")
print("-" * 20)
print(text[:500])
print("-" * 20)

cleaned = clean_text(text)
skills = extract_skills(cleaned)
print(f"Found Skills: {skills}")
