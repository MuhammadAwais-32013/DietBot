import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import os

class KnowledgeBaseRetriever:
    def __init__(self, faiss_dir: str, device: str = 'cpu'):
        self.indices = []
        self.chunks = []
        self.sources = []
        model_path = './models/all-MiniLM-L6-v2'
        try:
            # Try to load the model with explicit device handling
            self.model = SentenceTransformer(model_path)
            # Move to device after loading to avoid meta tensor issues
            if device != 'cpu':
                self.model = self.model.to(device)
        except Exception as e:
            # Fallback to CPU if device loading fails
            print(f"Warning: Could not load model on {device}, falling back to CPU. Error: {e}")
            self.model = SentenceTransformer(model_path, device='cpu')
        # Load all .index and _chunks.txt pairs in the directory
        for fname in os.listdir(faiss_dir):
            if fname.endswith('.index'):
                base = fname[:-6]
                chunk_file = os.path.join(faiss_dir, f"{base}_chunks.txt")
                index_file = os.path.join(faiss_dir, fname)
                if os.path.exists(chunk_file):
                    self.indices.append(faiss.read_index(index_file))
                    with open(chunk_file, 'r', encoding='utf-8') as f:
                        chunks = [c.strip() for c in f.read().split('\n---\n') if c.strip()]
                        self.chunks.append(chunks)
                        self.sources.append(base)

    def retrieve(self, query: str, top_k: int = 5):
        query_emb = self.model.encode([query]).astype('float32')
        all_results = []
        for idx, (index, chunks, source) in enumerate(zip(self.indices, self.chunks, self.sources)):
            D, I = index.search(query_emb, min(top_k, len(chunks)))
            for rank, (i, d) in enumerate(zip(I[0], D[0])):
                all_results.append({
                    'chunk': chunks[i],
                    'score': float(d),
                    'source': source,
                    'rank': rank + 1
                })
        # Sort all results by score (ascending, as lower L2 distance is better)
        all_results.sort(key=lambda x: x['score'])
        return all_results[:top_k]

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Query the knowledge base (multi-source).")
    parser.add_argument('--faiss_dir', required=True, help='Directory with FAISS indices and chunk files')
    parser.add_argument('--query', required=True, help='Query string')
    parser.add_argument('--topk', type=int, default=5, help='Number of results to return')
    args = parser.parse_args()
    retriever = KnowledgeBaseRetriever(args.faiss_dir)
    results = retriever.retrieve(args.query, args.topk)
    for i, res in enumerate(results):
        print(f"Result {i+1} (Source: {res['source']}, Score: {res['score']:.2f}):\n{res['chunk']}\n---\n") 