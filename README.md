# DocMind — Offline AI PDF Summaries Using Local LLMs (Next.js + Ollama)

DocMind is an offline, privacy-preserving scientific PDF summarizer. It parses a research paper, extracts metadata, and generates section-wise summaries using a local LLM through Ollama — no cloud APIs, no external servers, fully private.

[![DocMind Demo](assets/Thumbnail.png)](https://drive.google.com/file/d/1KJWCttcg2LK6UthtI_K6s0ZDAg6izjO1/view?usp=sharing)

[![Demo Video](https://img.shields.io/badge/Watch-Demo-blue?style=for-the-badge)](https://drive.google.com/file/d/1KJWCttcg2LK6UthtI_K6s0ZDAg6izjO1/view?usp=sharing)

## 🚀 Features

### 🔍 Advanced PDF Parsing

- Cleans noisy PDF text
- Handles multi-column layouts
- Extracts metadata (year, authors, document type)
- Splits content into ~9,000-character chunks for optimal LLM processing

### 🤖 Local LLM Summarization

Powered by Ollama, supporting models such as:

- `mistral` (default)
- `llama3.1`
- Any LLM installed locally

**No internet required. 100% local.**

### 🧠 Produces a Structured 7-Field JSON

- Document Type
- Year
- Authors
- Content Summary
- Methods Summary
- Findings Summary
- Conclusion Summary

Perfect for:

- Research review
- Literature surveys
- Academic assignments
- Systematic reviews
- Data extraction pipelines

### 🎨 Clean & Modern UI

- Drag-and-drop PDF upload
- Real-time status indicators
- Beautiful glass-card layout
- Fully responsive
- Section-wise summary cards

### 🔐 Full Privacy

All computation happens locally:

- PDF stays on your device
- LLM inference is local
- No cloud communication

## 🏗️ Tech Stack

### Frontend & Backend

- Next.js 16 (App Router)
- TypeScript
- React
- CSS Modules

### AI

- Ollama (local model runtime)
- Mistral / LLaMA 3.1

### PDF Processing

- pdf-parse (CJS)
- Custom normalization + chunking logic

## 📁 Project Structure

```
docmind/
 ├── src/
 │   ├── app/
 │   │   ├── api/extract/route.ts      # API endpoint
 │   │   ├── page.tsx                  # Main UI
 │   │   └── page.module.css           # UI Styles
 │   ├── lib/doc-pipeline/
 │   │   ├── pdf.ts                    # Extract text from PDF
 │   │   ├── normalize.ts              # Clean text
 │   │   ├── pipeline.ts               # Chunk → LLM → Merge flow
 │   │   ├── schema.ts                 # JSON schema
 │   │   └── utils.ts                  # Helpers
 ├── public/
 ├── package.json
 ├── next.config.mjs
 ├── tsconfig.json
 └── README.md
```

## ⚙️ Installation & Setup

### 1️⃣ Install Node.js 20+

Next.js 16 requires:

```
Node.js >= 20.9.0
```

Check your version:

```bash
node -v
```

If lower → install from: https://nodejs.org/en/download

### 2️⃣ Install Ollama

Download Ollama from: https://ollama.ai

Start the server:

```bash
ollama serve
```

Install the model:

```bash
ollama pull mistral
```

(Optional) Use a different model:

```bash
export OLLAMA_MODEL="llama3.1"
```

### 3️⃣ Install Dependencies

Navigate to your project:

```bash
cd docmind
npm install
```

### 4️⃣ Start Development Server

```bash
npm run dev
```

App will run at:
👉 http://localhost:3000

## 🧪 How It Works (Full Flow)

### 1. Upload PDF

You drag-and-drop or choose a file.

### 2. PDF Processing

Backend:

- Extracts text using `pdf-parse`
- Cleans + normalizes content
- Splits into ~9k-char chunks

### 3. Local LLM Summaries

Each chunk is sent to Ollama:

```
mistral → summarize → structured output
```

### 4. Merge & Validate

Outputs are merged into a clean 7-field JSON.

### 5. Display

Frontend renders each section in beautiful cards.

## 💡 Usage Guide

1. Run your Ollama server
2. Start Next.js
3. Upload your scientific PDF
4. Click **Run Extraction**
5. View:
   - Metadata
   - Content Summary
   - Methods Summary
   - Findings Summary
   - Conclusion Summary

Use it for:

- Paper reviews
- Academic research
- Thesis writing
- Deep literature analysis
- Extracting insights fast

## 🔗 Learn More

To learn more about the technologies powering DocMind:

- [Ollama Documentation](https://ollama.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Docs](https://www.typescriptlang.org)
- [pdf-parse](https://www.npmjs.com/package/pdf-parse)

---

Built for researchers, students, and knowledge workers.

## © Copyright

Copyright © 2025 Suloni Praveen. All rights reserved.
