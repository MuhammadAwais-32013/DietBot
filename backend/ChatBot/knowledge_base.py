import os
from typing import List
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from tqdm import tqdm

# 1. Extract text from PDF

def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

# 2. Chunk text into segments

def chunk_text(text: str, max_tokens: int = 400) -> List[str]:
    import re
    sentences = re.split(r'(?<=[.!?]) +', text)
    chunks = []
    chunk = ""
    for sentence in sentences:
        if len((chunk + sentence).split()) > max_tokens:
            chunks.append(chunk.strip())
            chunk = sentence
        else:
            chunk += " " + sentence
    if chunk:
        chunks.append(chunk.strip())
    return chunks

# 3. Embed chunks

def embed_chunks(chunks: List[str], model_name: str = 'sentence-transformers/all-MiniLM-L6-v2') -> np.ndarray:
    model = SentenceTransformer(model_name)
    embeddings = model.encode(chunks, show_progress_bar=True)
    return np.array(embeddings)

# 4. Store embeddings in FAISS

def store_embeddings(embeddings: np.ndarray, faiss_index_path: str):
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    faiss.write_index(index, faiss_index_path)

# 5. Full pipeline

def process_pdf_to_faiss(pdf_path: str, faiss_index_path: str, chunk_path: str):
    text = extract_text_from_pdf(pdf_path)
    chunks = chunk_text(text)
    embeddings = embed_chunks(chunks)
    store_embeddings(embeddings, faiss_index_path)
    # Save chunks for retrieval
    with open(chunk_path, 'w', encoding='utf-8') as f:
        for chunk in chunks:
            f.write(chunk + '\n---\n')
    print(f"Processed {len(chunks)} chunks and stored embeddings in {faiss_index_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Process PDF to FAISS index.")
    parser.add_argument('--pdf', required=True, help='Path to PDF file')
    parser.add_argument('--faiss', required=True, help='Path to save FAISS index')
    parser.add_argument('--chunks', required=True, help='Path to save text chunks')
    args = parser.parse_args()
    process_pdf_to_faiss(args.pdf, args.faiss, args.chunks) 