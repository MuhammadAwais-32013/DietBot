import pytesseract
from PIL import Image
import fitz  # PyMuPDF for PDF images
import re
from typing import Dict, List, Union
import os

def extract_text_from_image(image_path: str) -> str:
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    return text

def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap()
        img_path = f"_temp_page_{page_num}.png"
        pix.save(img_path)
        text += extract_text_from_image(img_path) + "\n"
        os.remove(img_path)
    return text

def extract_text_only(file_path: str) -> str:
    """Extract only text from file without parsing medical values"""
    ext = os.path.splitext(file_path)[-1].lower()
    if ext in ['.jpg', '.jpeg', '.png']:
        return extract_text_from_image(file_path)
    elif ext == '.pdf':
        return extract_text_from_pdf(file_path)
    else:
        raise ValueError('Unsupported file type')

def parse_medical_values(text: str) -> Dict[str, Union[str, float, List[float]]]:
    # Glucose (mg/dL)
    glucose = re.findall(r'(?:glucose|fasting)[^\d]*(\d{2,3})', text, re.IGNORECASE)
    # BP (e.g., 120/80)
    bp = re.findall(r'(\d{2,3})\s*/\s*(\d{2,3})', text)
    # Cholesterol (mg/dL)
    cholesterol = re.findall(r'(?:cholesterol)[^\d]*(\d{2,3})', text, re.IGNORECASE)
    return {
        'glucose': [int(g) for g in glucose] if glucose else None,
        'bp': [f"{s}/{d}" for s, d in bp] if bp else None,
        'cholesterol': [int(c) for c in cholesterol] if cholesterol else None
    }

def extract_and_parse(file_path: str) -> Dict[str, Union[str, float, List[float]]]:
    ext = os.path.splitext(file_path)[-1].lower()
    if ext in ['.jpg', '.jpeg', '.png']:
        text = extract_text_from_image(file_path)
    elif ext == '.pdf':
        text = extract_text_from_pdf(file_path)
    else:
        raise ValueError('Unsupported file type')
    return parse_medical_values(text)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Extract and parse medical values from image or PDF.")
    parser.add_argument('--file', required=True, help='Path to image or PDF file')
    args = parser.parse_args()
    results = extract_and_parse(args.file)
    print("Extracted values:", results) 