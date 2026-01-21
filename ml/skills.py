import re

# A comprehensive list of technical skills for extraction
SKILL_DB = [
    'python', 'java', 'c++', 'c#', 'javascript', 'typescript', 'html', 'css', 
    'react', 'angular', 'vue', 'node.js', 'nodejs', 'express', 'django', 'flask', 
    'spring', 'sql', 'mysql', 'postgresql', 'mongodb', 'aws', 'azure', 'gcp', 
    'docker', 'kubernetes', 'git', 'linux', 'machine learning', 'deep learning',
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'nlp', 'computer vision',
    'agile', 'scrum', 'jira', 'rest api', 'graphql', 'devops', 'ci/cd',
    'tableau', 'power bi', 'excel', 'spark', 'hadoop'
]

def extract_skills(text):
    found_skills = set()
    # Simple keyword matching for now (efficient and effective for this scope)
    # Could be enhanced with NLTK/Spacy named entity recognition
    for skill in SKILL_DB:
        # Use word boundary check to avoid partial matches (e.g., "java" in "javascript")
        # specific handling for c++ and c#
        escaped_skill = re.escape(skill)
        pattern = r'\b' + escaped_skill + r'\b'
        
        # Handle special cases like c++ or node.js where word boundaries might fail with regex defaults
        if skill in ['c++', 'c#', 'node.js', 'nodejs']:
             if skill in text:
                 found_skills.add(skill)
        else:
            if re.search(pattern, text):
                found_skills.add(skill)
    
    return list(found_skills)

def identify_missing_skills(job_desc_text, candidate_skills):
    jd_skills = extract_skills(job_desc_text)
    missing = [skill for skill in jd_skills if skill not in candidate_skills]
    return missing, jd_skills

def identify_extra_skills(job_desc_text, candidate_skills):
    """
    Identify skills the candidate has that are not in the job description.
    These are 'bonus' skills.
    """
    jd_skills = extract_skills(job_desc_text)
    extra = [skill for skill in candidate_skills if skill not in jd_skills]
    return extra

def calculate_skill_match_score(job_desc_text, candidate_skills):
    """
    Calculate skill match percentage.
    Returns a score between 0-100 based on how many JD skills the candidate has.
    """
    jd_skills = extract_skills(job_desc_text)
    if not jd_skills:
        return 0.0
    
    matched_count = sum(1 for skill in jd_skills if skill in candidate_skills)
    return (matched_count / len(jd_skills)) * 100


