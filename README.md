# AI Career Coach 🤖💼

A professional tool designed to analyze the alignment between a resume and job requirements. The system uses AI to conduct a deep comparison of skills, identify critical gaps, and prepare candidates for interviews.

## 🚀 Key Features

* **Smart Analysis**: Compares PDF resumes with job descriptions directly from a URL.
* **Interview Roadmap**: Automatically generates 5 technical questions based on identified gaps with expected answers.
* **Multi-language Support**: Full support for English, Russian, Ukrainian, German, and Spanish.
* **PDF Export**: Save a beautifully formatted analysis report with color-coded sections.
* **Markdown Rendering**: Clean, professional report visualization with headers, lists, and bold accents.

## 🛠 Tech Stack

* **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide Icons.
* **Backend**: Next.js API Routes, Puppeteer (for job scraping).
* **AI Engine**: Ollama (Llama 3.1 8B model).
* **Deployment**: Render (Docker Runtime).

## ⚙️ Setup and Installation

### 1. Prerequisites
* Node.js 20+
* Ollama installed (locally or on a remote server)
* Cloudflare Tunnel (if Ollama is running behind NAT)

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
OLLAMA_HOST=[https://your-tunnel-url.trycloudflare.com](https://your-tunnel-url.trycloudflare.com)
OLLAMA_MODEL=llama3.1:8b
```

### Block 3: Docker Deployment and Project Structure
## 🐳 Deployment (Docker / Render)

To ensure Puppeteer works correctly in a cloud environment, this project is configured to run via Docker.

1. **Service Creation**: Select `Docker` as the Runtime when creating a New Web Service on Render.
2. **Environment Variables on Render**:
   - `OLLAMA_HOST`: Your tunnel URL.
   - `PUPPETEER_EXECUTABLE_PATH`: `/usr/bin/google-chrome-stable`.
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: `true`.

## 📂 Project Structure

* `src/app/api/analyze`: Main logic for analysis and response streaming from Ollama.
* `src/app/api/pdf`: Logic for generating PDF documents from Markdown text.
* `src/components/OutputArea`: Report visualization with Markdown style support.
* `src/lib/prompts`: System instructions and formatting rules for the AI recruiter.

## 📄 License
MIT
