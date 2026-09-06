import fitz
from fastapi import UploadFile
#extracting text from pdf and text from image inside pdf

async def extract_pdf(file: UploadFile) -> list[dict]:
    file_bytes = await file.read()

    doc = fitz.open(
        stream=file_bytes,
        filetype="pdf"
    )
    try:
        pages =[]
        
        for page_number ,page in enumerate(doc, start = 1):
            text = page.get_text()

            if not text.strip():
                text_page = page.get_textpage_ocr()
                text = page.get_text(textpage=text_page)
                
            pages.append({"page_number":page_number, "text": text})

        return pages
    finally:
        doc.close()

