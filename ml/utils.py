import re
import sys
import pdfplumber
import pypdf
import fitz  # pymupdf

def extract_text_from_pdf(pdf_path):
    text = ""
    Method = "pdfplumber"
    
    # Method 1: pdfplumber
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"pdfplumber failed: {e}")

    # Method 2: pypdf Fallback
    if len(text.strip()) < 50:
        Method = "pypdf"
        try:
            reader = pypdf.PdfReader(pdf_path)
            pypdf_text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    pypdf_text += extracted + "\n"
            
            if len(pypdf_text) > len(text):
                text = pypdf_text
        except Exception as e:
            print(f"pypdf failed: {e}")

    # Method 3: pymupdf (fitz) Fallback - Strongest for layout issues
    if len(text.strip()) < 50:
        Method = "pymupdf"
        try:
            doc = fitz.open(pdf_path)
            fitz_text = ""
            for page in doc:
                fitz_text += page.get_text() + "\n"
            
            if len(fitz_text) > len(text):
                text = fitz_text
        except Exception as e:
             print(f"pymupdf failed: {e}")

    # Method 4: OCR (EasyOCR) - The "Nuclear Option" for Images
    # Only run if text is still empty (Font Count 0 scenario)
    if len(text.strip()) < 50:
        sys.stderr.write("Debug: Triggering OCR Fallback...\n")
        try:
            import easyocr
            import numpy as np
            # Use fitz to get image from page
            doc = fitz.open(pdf_path)
            ocr_text = ""
            # Initialize Reader (this might take time)
            reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            
            for i, page in enumerate(doc):
                sys.stderr.write(f"Debug: OCR Scanning page {i+1}...\n")
                # Increase resolution (3x = ~216 DPI, good for OCR)
                mat = fitz.Matrix(3, 3)
                pix = page.get_pixmap(matrix=mat)
                
                # Convert to numpy for easyocr
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.h, pix.w, pix.n))
                if pix.n == 4: # RGBA -> RGB
                    img = np.ascontiguousarray(img[..., :3])
                elif pix.n == 3: # RGB
                    pass
                else: 
                     # Grayscale or other, convert to RGB for safety
                     import cv2
                     img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)

                result = reader.readtext(img, detail=0)
                page_content = " ".join(result)
                sys.stderr.write(f"Debug: Page {i+1} OCR found {len(page_content)} chars\n")
                ocr_text += page_content + "\n"
            
            if len(ocr_text) > len(text):
                text = ocr_text
                sys.stderr.write(f"Debug: OCR Final Success! Extracted {len(text)} chars\n")
            else:
                sys.stderr.write(f"Debug: OCR finished but found low text ({len(ocr_text)})\n")
                
        except ImportError:
             sys.stderr.write("OCR failed: easyocr module not found. Please pip install easyocr.\n")
        except Exception as e:
            sys.stderr.write(f"OCR failed calling easyocr: {e}\n")
            import traceback
            traceback.print_exc(file=sys.stderr)
            
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
    
    # Fix common PDF extraction issues where words are joined (e.g. "JavaDeveloper")
    # This is risky but helps with bad columns. 
    # Try to split CamelCase if possible? No, too risky.
    # Instead, ensure spacing around known delimiters
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text) # CamelCase split attempt (weak but helper)
    text = text.replace('|', ' ') # Replace pipes with space
    text = text.replace('/', ' ') # Replace slashes with space
    text = text.replace('•', ' ') # Replace bullets with space
    
    # Remove special characters but keep letters, numbers, spaces, +, #, and . (for node.js, .net, c++, c#)
    text = re.sub(r'[^a-z0-9\s+#\.]', '', text)
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
