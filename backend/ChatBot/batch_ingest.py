import os
from knowledge_base import extract_text_from_pdf, chunk_text, embed_chunks, store_embeddings

def batch_ingest(pdf_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]
    for pdf_file in pdf_files:
        pdf_path = os.path.join(pdf_dir, pdf_file)
        base_name = os.path.splitext(pdf_file)[0]
        faiss_index_path = os.path.join(output_dir, f"{base_name}.index")
        chunk_path = os.path.join(output_dir, f"{base_name}_chunks.txt")
        print(f"Processing {pdf_file} ...")
        text = extract_text_from_pdf(pdf_path)
        chunks = chunk_text(text)
        embeddings = embed_chunks(chunks)
        store_embeddings(embeddings, faiss_index_path)
        with open(chunk_path, 'w', encoding='utf-8') as f:
            for chunk in chunks:
                f.write(chunk + '\n---\n')
        print(f"Done: {pdf_file} -> {faiss_index_path}, {chunk_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Batch ingest all PDFs in a directory.")
    parser.add_argument('--pdf_dir', required=True, help='Directory containing PDF files')
    parser.add_argument('--output_dir', required=True, help='Directory to save FAISS indices and chunk files')
    args = parser.parse_args()
    batch_ingest(args.pdf_dir, args.output_dir) 