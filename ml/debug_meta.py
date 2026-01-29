
import fitz
import sys
import os

upload_dir = r"d:\ResumeShortlist\backend\uploads"
pdf_files = [os.path.join(upload_dir, f) for f in os.listdir(upload_dir) if f.endswith('.pdf')]
if not pdf_files:
    sys.exit(1)

latest_pdf = max(pdf_files, key=os.path.getctime)
print(f"Checking: {latest_pdf}")

try:
    doc = fitz.open(latest_pdf)
    page = doc[0]
    
    # Check text
    text = page.get_text()
    print(f"Text Length: {len(text)}")
    
    # Check Images
    images = page.get_images()
    print(f"Image Count: {len(images)}")
    
    # Check Fonts
    fonts = page.get_fonts()
    print(f"Font Count: {len(fonts)}")
    
    print(f"Metadata: {doc.metadata}")
except Exception as e:
    print(f"Error: {e}")
