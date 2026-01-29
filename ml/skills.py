import re

# Canonical Skill List
SKILL_DB = [
    'python', 'java', 'c++', 'c#', 'javascript', 'typescript', 'html', 'css', 
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 
    'spring', 'sql', 'mysql', 'postgresql', 'mongodb', 'aws', 'azure', 'gcp', 
    'docker', 'kubernetes', 'git', 'linux', 'machine learning', 'deep learning',
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'nlp', 'computer vision',
    'agile', 'scrum', 'jira', 'rest api', 'graphql', 'devops', 'ci/cd',
    'tableau', 'power bi', 'excel', 'spark', 'hadoop'
]

# Aliases for normalization (variation -> canonical)
SKILL_ALIASES = {
    'reactjs': 'react', 'react.js': 'react',
    'nodejs': 'node.js', 'node js': 'node.js',
    'musql': 'mysql', # common typo
    'postgres': 'postgresql',
    'js': 'javascript',
    'ts': 'typescript',
    'golang': 'go',
    'ml': 'machine learning',
    'dl': 'deep learning',
    'cv': 'computer vision',
    'aws web services': 'aws',
    'google cloud': 'gcp',
    'google cloud platform': 'gcp',
    'cplusplus': 'c++',
    'csharp': 'c#',
    'html5': 'html',
    'css3': 'css'
}

def extract_skills(text):
    text = text.lower()
    found_skills = set()
    
    # Check Canonical Skills
    for skill in SKILL_DB:
        # Handle special chars
        escaped_skill = re.escape(skill)
        # Boundary check: \b matches transition from word to non-word char (like space, punctuation)
        # For "C++", + is not a word char, so \bC\+\+\b might fail depending on context if followed by space vs dot
        # We'll use a slightly more robust regex for these specific cases
        if skill in ['c++', 'c#', '.net']:
            pattern = re.compile(re.escape(skill)) # simpler check for these
             # Check if it exists with whitespace around or start/end of string
            # This is a bit loose but C++ is rare to mis-match (unlike 'C')
            if pattern.search(text):
                found_skills.add(skill)
        else:
            pattern = r'\b' + escaped_skill + r'\b'
            if re.search(pattern, text):
                found_skills.add(skill)

    # Check Aliases
    for alias, canonical in SKILL_ALIASES.items():
        if canonical in found_skills:
            continue # already found
            
        escaped_alias = re.escape(alias)
        pattern = r'\b' + escaped_alias + r'\b'
        if re.search(pattern, text):
            found_skills.add(canonical)
            
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


