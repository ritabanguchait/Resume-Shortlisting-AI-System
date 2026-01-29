
import re
from skills import extract_skills

test_cases = [
    "Experienced in Python, Java, and C++.",
    "Proficient with ReactJS and Node.js.",
    "Skills: HTML5, CSS3, JavaScript (ES6+).",
    "Familiar with AWS EC2 and Google Cloud Platform (GCP).",
    "Backend: Express.js, MongoDB, PostgreSQL.",
    "Tools: Git, Docker, Kubernetes."
]

print("--- Skill Extraction Debug ---")
for text in test_cases:
    clean = text.lower() # Simulate simple cleaning
    skills = extract_skills(clean)
    print(f"Text: '{text}'\nFound: {skills}\n")
