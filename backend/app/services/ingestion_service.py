from app.services.pdf_service import extract_pdf
from app.services.chunking_service import chunk_pages
from app.services.embedding_service import embed_chunks

def process_document(pdf_path: str):
    pages =extract_pdf(pdf_path)
    chunks =chunk_pages(pages)
    #embeded= embed_chunks(chunks)
    #return embeded



if __name__ == "__main__":
    process_document("app/services/Topic 1 - Introduction_to_Operating_Systems_History.pdf")