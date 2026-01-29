import sys
import json
import os
import numpy as np
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

try:
    from sentence_transformers import SentenceTransformer, util
except ImportError as e:
    sys.stderr.write(f"ImportError: {str(e)}\n")
    sys.exit(1)

from utils import extract_text_from_pdf, clean_text, extract_experience
from skills import extract_skills, identify_missing_skills, identify_extra_skills, calculate_skill_match_score

try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    sys.stderr.write(f"ModelLoadError: {str(e)}\n")
    sys.exit(1)

def get_selection_chance(score):
    if score >= 80: return "High"
    if score >= 50: return "Medium"
    return "Low"

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            return

        request = json.loads(input_data)
        
        job_description = request.get('job_description', '')
        file_paths = request.get('file_paths', [])
        
        if not job_description or not file_paths:
            print(json.dumps([]))
            return

        # Prepare JD
        cleaned_jd = clean_text(job_description)
        jd_embedding = model.encode(cleaned_jd, convert_to_tensor=True)
        jd_skills_all = extract_skills(cleaned_jd)
        
        results = []
        
        for file_path in file_paths:
            if not os.path.exists(file_path):
                continue
                
            raw_text = extract_text_from_pdf(file_path)
            cleaned_text = clean_text(raw_text)
            
            # Handle empty/scanned PDFs
            # Handle empty/scanned PDFs
            if not cleaned_text or len(cleaned_text) < 50:
                sys.stderr.write(f"Warning: Low text content for {file_path} (len={len(cleaned_text) if cleaned_text else 0})\n")
                cleaned_text = ""
                candidate_skills = []
                experience_years = 0
                semantic_score = 0
            else:
                sys.stderr.write(f"Debug: Analyzing {file_path} against Job Description (len={len(cleaned_jd)}). Text len: {len(cleaned_text)}\n")
                
                # 1. Semantic Score
                resume_embedding = model.encode(cleaned_text, convert_to_tensor=True)
                similarity = util.cos_sim(jd_embedding, resume_embedding).item()
                semantic_score = float(max(0, similarity * 100))
                
                sys.stderr.write(f"Debug: Match Semantic Score: {semantic_score}\n")

                candidate_skills = extract_skills(cleaned_text)
                experience_years = extract_experience(raw_text)
            
            # Skill Analysis
            missing_skills, _ = identify_missing_skills(cleaned_jd, candidate_skills)
            extra_skills = identify_extra_skills(cleaned_jd, candidate_skills)
            skill_score = calculate_skill_match_score(cleaned_jd, candidate_skills)
            
            # Experience Score (Target: 3 years)
            if experience_years >= 3:
                exp_score = 100
            else:
                exp_score = (experience_years / 3) * 100
                
            # Final Weighted Score
            # 50% Semantic (Deep content match)
            # 30% Hard Skills (Keywords)
            # 20% Experience
            final_score = (semantic_score * 0.5) + (skill_score * 0.3) + (exp_score * 0.2)
            final_score = round(max(0, min(100, final_score)), 1)
            
            selection_chance = get_selection_chance(final_score)
            status = "Shortlisted" if selection_chance != "Low" else "Rejected"
            
            # --- Improvement Plan & Insights ---
            pros = []
            cons = []
            improvement_tips = []
            
            # --- Improvement Plan & Insights ---
            pros = []
            cons = []
            improvement_tips = []
            
            if final_score > 75:
                pros.append("Strong overall match with job requirements")
            if skill_score > 80:
                pros.append("Excellent technical skill coverage")
            if experience_years >= 3:
                 pros.append(f"Solid experience level ({experience_years} years)")
            
            if missing_skills:
                cons.append(f"Missing critical skills: {', '.join(missing_skills[:3])}")
                improvement_tips.append(f"Learn and add these skills: {', '.join(missing_skills)}")
            
            if semantic_score < 50:
                cons.append("Resume content strongly diverges from Job Description context")
                improvement_tips.append("Tailor your summary and bullet points to match the language of the JD.")
                
            if experience_years < 2:
                improvement_tips.append("Highlight academic projects or internships to compensate for lower experience.")
            
            if not candidate_skills:
                improvement_tips.append("Your resume might not be parsing correctly. Avoid complex layouts or graphics.")

            results.append({
                "fileName": os.path.basename(file_path),
                "matchPercentage": final_score,
                "semanticScore": round(semantic_score, 1),
                "skillScore": round(skill_score, 1),
                "selectionChance": selection_chance,
                "status": status,
                "skills": candidate_skills,
                "missingSkills": missing_skills,
                "experienceYears": experience_years,
                "pros": pros,
                "cons": cons,
                "improvementTips": improvement_tips,
                "downloadLink": f"/uploads/{os.path.basename(file_path)}"
            })
            
        results.sort(key=lambda x: x['matchPercentage'], reverse=True)
        print(json.dumps(results))

    except Exception:
        # Return empty list on critical failure to prevent backend crash
        print(json.dumps([]))

if __name__ == "__main__":
    main()
