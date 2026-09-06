import pymupdf #this is extract the text from pdf
from langchain_text_splitters import RecursiveCharacterTextSplitter



#extracting text from pdf and text from image inside pdf

def extract_pdf(pdf_path: str) -> list[dict]:
    doc = pymupdf.open(pdf_path)
    pages =[]
    
    for page_number ,page in enumerate(doc, start = 1):
        text = page.get_text()

        if not text.strip():
            text_page = page.get_textpage_ocr()
            text = page.get_text(textpage=text_page)
            
        pages.append({"page_number":page_number, "text": text})

    doc.close()
    return pages
