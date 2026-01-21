import re
import pdfplumber

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return text

def clean_text(text):
    if not text:
        return ""
    # Lowercase
    text = text.lower()
    # Remove email addresses
    text = re.sub(r'[\w\.-]+@[\w\.-]+', '', text)
    # Remove URLs
    text = re.sub(r'http\S+', '', text)
    # Remove special characters and numbers (keep letters and spaces)
    # We might want to keep +, # for C++, C#
    text = re.sub(r'[^a-z\s+#]', '', text)
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_experience(text):
    """
    Extract years of experience from resume text.
    Returns the maximum years found, or 0 if none detected.
    """
    if not text:
        return 0
    
    # Common patterns for experience
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience',
        r'experience\s+(?:of\s+)?(\d+)\+?\s*(?:years?|yrs?)',
        r'(\d+)\+?\s*(?:years?|yrs?)\s+in',
        r'worked\s+for\s+(\d+)\+?\s*(?:years?|yrs?)',
    ]
    
    years_found = []
    text_lower = text.lower()
    
    for pattern in patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            try:
                years_found.append(int(match))
            except ValueError:
                continue
    
    return max(years_found) if years_found else 0
