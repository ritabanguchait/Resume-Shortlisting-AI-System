
import sys
import os

try:
    import torch
    print(f"Torch available: {torch.__version__}")
except ImportError:
    print("Torch missing")

try:
    import cv2
    print(f"OpenCV available: {cv2.__version__}")
except ImportError:
    print("OpenCV missing")
    
pdf_path = r"d:\ResumeShortlist\backend\uploads\1768162275819-14556043-ritaban_guchait_resume.pdf"
if os.path.exists(pdf_path):
    print(f"Target PDF exists: {pdf_path}")
else:
    print("Target PDF not found")
