import os
import json
import random
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
try:
    from sentence_transformers import SentenceTransformer, util
except ImportError:
    print("Installing sentence-transformers...")
    import subprocess
    subprocess.check_call(["pip", "install", "sentence-transformers", "scikit-learn", "pandas"])
    from sentence_transformers import SentenceTransformer, util

# Configuration
MODEL_NAME = 'all-MiniLM-L6-v2'
DATASET_PATH = 'ml/dataset/'
METRICS_PATH = 'ml/metrics.json'

def generate_synthetic_data(num_samples=100):
    """
    Generates synthetic (JD, Resume, Label) pairs.
    Label 1 = Match (Shortlist), 0 = No Match (Reject)
    """
    print(f"Generating {num_samples} synthetic samples...")
    
    technical_skills = ["Python", "JavaScript", "React", "Node.js", "Java", "SQL", "AWS", "Docker", "Kubernetes", "Machine Learning"]
    soft_skills = ["Communication", "Leadership", "Teamwork", "Problem Solving"]
    roles = ["Software Engineer", "Data Scientist", "Product Manager", "DevOps Engineer"]
    
    data = []
    
    for _ in range(num_samples):
        role = random.choice(roles)
        
        # Create JD
        jd_skills = random.sample(technical_skills, k=3)
        jd_text = f"We are looking for a {role} with experience in {', '.join(jd_skills)}."
        
        # Create Match (Positive Sample)
        if random.random() > 0.5:
            # 80-100% overlap
            resume_skills = jd_skills + random.sample(soft_skills, k=1)
            resume_text = f"Experienced {role} skilled in {', '.join(resume_skills)}. {random.choice(soft_skills)}."
            label = 1
        else:
            # Create Mismatch (Negative Sample)
            # Pick skills NOT in JD
            other_skills = list(set(technical_skills) - set(jd_skills))
            if not other_skills: other_skills = ["Cooking", "Painting"] # Fallback
            resume_skills = random.sample(other_skills, k=min(3, len(other_skills)))
            
            # Maybe a different role too
            other_role = random.choice([r for r in roles if r != role])
            resume_text = f"{other_role} with expertise in {', '.join(resume_skills)}."
            label = 0
            
        data.append({
            "job_description": jd_text,
            "resume_text": resume_text,
            "label": label
        })
        
    return pd.DataFrame(data)

def train_and_evaluate():
    # 1. Load or Generate Data
    if not os.path.exists(DATASET_PATH):
        os.makedirs(DATASET_PATH, exist_ok=True)
        
    csv_file = os.path.join(DATASET_PATH, 'synthetic_data.csv')
    
    if os.path.exists(csv_file):
        print(f"Loading data from {csv_file}")
        df = pd.read_csv(csv_file)
    else:
        df = generate_synthetic_data(num_samples=200)
        df.to_csv(csv_file, index=False)
        print(f"Saved synthetic data to {csv_file}")

    # 2. Split Data
    print("Splitting data into Train and Test sets...")
    X_train, X_test, y_train, y_test = train_test_split(
        df[['job_description', 'resume_text']], 
        df['label'], 
        test_size=0.2, 
        random_state=42
    )
    
    # 3. Load Model
    print(f"Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    
    # 4. Compute Embeddings & Similarity
    print("Computing embeddings...")
    
    def get_similarity(row):
        jd_emb = model.encode(row['job_description'], convert_to_tensor=True)
        res_emb = model.encode(row['resume_text'], convert_to_tensor=True)
        return util.cos_sim(jd_emb, res_emb).item()

    # We evaluate on the TEST set to see how well cosine similarity predicts the label
    print("Evaluating on Test set...")
    X_test['similarity'] = X_test.apply(get_similarity, axis=1)
    
    # 5. Determine Optimal Threshold (Simple Training)
    # in a real fine-tuning, we'd update weights. Here we find the best 'cut-off'.
    best_threshold = 0.5
    best_acc = 0
    
    thresholds = np.arange(0.1, 0.9, 0.05)
    for thresh in thresholds:
        preds = (X_test['similarity'] > thresh).astype(int)
        acc = accuracy_score(y_test, preds)
        if acc > best_acc:
            best_acc = acc
            best_threshold = thresh
            
    print(f"Optimal Similarity Threshold found: {best_threshold:.2f}")
    
    # 6. Final Metrics
    final_preds = (X_test['similarity'] > best_threshold).astype(int)
    report = classification_report(y_test, final_preds, output_dict=True)
    cm = confusion_matrix(y_test, final_preds)
    
    print("\n--- Model Performance Report ---")
    print(f"Accuracy: {best_acc:.2%}")
    print("Confusion Matrix:")
    print(cm)
    print("\nClassification Report:")
    print(classification_report(y_test, final_preds))
    
    # Save Metrics
    metrics = {
        "model_name": MODEL_NAME,
        "optimal_threshold": float(best_threshold),
        "accuracy": best_acc,
        "precision": report['weighted avg']['precision'],
        "recall": report['weighted avg']['recall'],
        "f1_score": report['weighted avg']['f1-score']
    }
    
    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=4)
        
    print(f"\nMetrics saved to {METRICS_PATH}")
    return metrics

if __name__ == "__main__":
    train_and_evaluate()
