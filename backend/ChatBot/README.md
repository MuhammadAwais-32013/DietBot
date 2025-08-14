# 🩺 DietBot: Personalized Diet Planning for Diabetes & Hypertension

## Overview
DietBot is an AI-powered web application for generating personalized diet plans for patients with diabetes and hypertension. It leverages Retrieval-Augmented Generation (RAG) to ground its recommendations in scientific literature, books, and articles you provide.

---

## 📁 Project Structure
```
DietBot/
│
├── app.py                # Streamlit web app
├── retriever.py          # RAG retrieval logic (FAISS + chunked text)
├── knowledge_base.py     # PDF-to-FAISS pipeline for single files
├── batch_ingest.py       # Batch PDF ingestion for RAG
├── ocr_parser.py         # Extracts medical values from images/PDFs
├── gemini_llm.py         # Gemini LLM integration
├── requirements.txt      # Python dependencies
├── README.md             # This guide
│
├── data/                 # Your knowledge base (PDFs, .index, _chunks.txt)
│   ├── *.pdf
│   ├── *.index
│   └── *_chunks.txt
│
└── .streamlit/
    └── secrets.toml      # Gemini API key (for LLM)
```

---

## 🚀 Setup Instructions

### 1. Clone & Install Dependencies
```bash
# Clone the repository
cd path/to/DietBot
python -m venv .venv
.venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

### 2. Add Your Knowledge Base (PDFs)
- Place your reference PDFs (books, articles, guidelines) in the `data/` folder.

### 3. Build the RAG Knowledge Base
#### **Batch Ingest (Recommended for Multiple PDFs):**
```bash
python batch_ingest.py --pdf_dir data --output_dir data
```
- This will process all PDFs in `data/`, creating `.index` and `_chunks.txt` files for each.

#### **Single PDF Ingest:**
```bash
python knowledge_base.py --pdf path/to/file.pdf --faiss path/to/output.index --chunks path/to/output_chunks.txt
```

### 4. Add Your Gemini API Key
Create `.streamlit/secrets.toml` in the project root:
```toml
[gemini]
api_key = "YOUR_GEMINI_API_KEY"
```

### 5. Run the App
```bash
streamlit run app.py
```
- Open your browser at [http://localhost:8501](http://localhost:8501)

---

## 🧠 How RAG Works in DietBot
- **PDFs** are chunked and embedded using `sentence-transformers`.
- **FAISS** indexes are built for fast semantic search.
- When you ask a question or request a plan, relevant chunks are retrieved and provided as context to the Gemini LLM.

---

## ➕ Adding More References to RAG
1. **Add new PDFs** to the `data/` folder.
2. **Re-run the batch ingest command:**
   ```bash
   python batch_ingest.py --pdf_dir data --output_dir data
   ```
   This will update the `.index` and `_chunks.txt` files for all PDFs.

---

## 🛠️ Useful Commands
| Task                                 | Command Example                                                                 |
|-------------------------------------- |-------------------------------------------------------------------------------|
| Install dependencies                 | `pip install -r requirements.txt`                                              |
| Batch ingest all PDFs                 | `python batch_ingest.py --pdf_dir data --output_dir data`                      |
| Ingest a single PDF                   | `python knowledge_base.py --pdf file.pdf --faiss file.index --chunks file.txt` |
| Run the app                           | `streamlit run app.py`                                                         |
| Extract medical values from a file     | `python ocr_parser.py --file path/to/record.pdf`                               |

---

## 📝 Customization & Tips
- **Change the number of days:** Use the dropdown in the app to generate 7, 14, 21, or 30-day plans.
- **Add more medical context:** Upload lab reports or enter values in the sidebar for more personalized plans.
- **Hide RAG context:** (Optional) Comment out or toggle the context display in `app.py`.

---

## ❓ FAQ
**Q: How do I add more scientific references?**  
A: Just add new PDFs to `data/` and re-run the batch ingest command.

**Q: Can I use other LLMs?**  
A: The app is built for Gemini, but you can adapt `gemini_llm.py` for other providers.

**Q: My RAG retrieval isn’t working!**  
A: Make sure `.index` and `_chunks.txt` files exist for each PDF in `data/`.

---

## 👩‍💻 Contributing
Pull requests and suggestions are welcome! Please open an issue for major changes.

---

## 📜 License
MIT License 