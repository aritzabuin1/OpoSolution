#!/usr/bin/env python3
"""
Extract text from GACE supuesto práctico PDFs.

Usage:
    pip install PyPDF2
    python extract_pdf.py supuesto_2024.pdf
    python extract_pdf.py supuesto_2022.pdf
    python extract_pdf.py  # extracts all PDFs in current directory

Output:
    Creates a .txt file with the same name as the PDF.
"""

import sys
import os
import glob

def extract_with_pypdf2(pdf_path: str) -> str:
    """Extract text using PyPDF2."""
    from PyPDF2 import PdfReader
    reader = PdfReader(pdf_path)
    text_parts = []
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            text_parts.append(f"--- Página {i+1} ---\n{page_text}")
    return "\n\n".join(text_parts)


def extract_with_pdfplumber(pdf_path: str) -> str:
    """Extract text using pdfplumber (better table handling)."""
    import pdfplumber
    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(f"--- Página {i+1} ---\n{page_text}")
    return "\n\n".join(text_parts)


def extract_with_pymupdf(pdf_path: str) -> str:
    """Extract text using PyMuPDF/fitz."""
    import fitz
    doc = fitz.open(pdf_path)
    text_parts = []
    for i, page in enumerate(doc):
        page_text = page.get_text()
        if page_text:
            text_parts.append(f"--- Página {i+1} ---\n{page_text}")
    return "\n\n".join(text_parts)


def extract_text(pdf_path: str) -> str:
    """Try multiple PDF libraries in order of preference."""
    errors = []

    # Try PyMuPDF first (best quality)
    try:
        return extract_with_pymupdf(pdf_path)
    except ImportError:
        errors.append("PyMuPDF (fitz) not installed: pip install PyMuPDF")
    except Exception as e:
        errors.append(f"PyMuPDF error: {e}")

    # Try pdfplumber second
    try:
        return extract_with_pdfplumber(pdf_path)
    except ImportError:
        errors.append("pdfplumber not installed: pip install pdfplumber")
    except Exception as e:
        errors.append(f"pdfplumber error: {e}")

    # Try PyPDF2 last
    try:
        return extract_with_pypdf2(pdf_path)
    except ImportError:
        errors.append("PyPDF2 not installed: pip install PyPDF2")
    except Exception as e:
        errors.append(f"PyPDF2 error: {e}")

    print("ERROR: No PDF library available. Install one of:")
    print("  pip install PyMuPDF    # best quality")
    print("  pip install pdfplumber # good for tables")
    print("  pip install PyPDF2     # basic extraction")
    for err in errors:
        print(f"  - {err}")
    sys.exit(1)


def main():
    if len(sys.argv) > 1:
        pdf_files = sys.argv[1:]
    else:
        pdf_files = sorted(glob.glob("*.pdf"))

    if not pdf_files:
        print("No PDF files found. Usage: python extract_pdf.py <file.pdf>")
        sys.exit(1)

    for pdf_path in pdf_files:
        if not os.path.exists(pdf_path):
            print(f"File not found: {pdf_path}")
            continue

        print(f"Extracting: {pdf_path}")
        text = extract_text(pdf_path)

        # Save to .txt
        txt_path = os.path.splitext(pdf_path)[0] + ".txt"
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(text)

        print(f"  -> {txt_path} ({len(text)} chars)")
        print(f"  Preview: {text[:200]}...")
        print()


if __name__ == "__main__":
    main()
