# AI Career Coach 🤖💼

A professional tool designed to analyze the alignment between a resume and job requirements. The system uses AI to conduct a deep comparison of skills, identify critical gaps, and prepare candidates for interviews.

## 🚀 Key Features

* **Smart Analysis**: Compares PDF resumes with job descriptions directly from a URL.
* **Interview Roadmap**: Automatically generates 5 technical questions based on identified gaps with expected answers.
* **Multi-language Support**: Full support for English, Russian, Ukrainian, German, and Spanish.
* **PDF Export**: Save a beautifully formatted analysis report with color-coded sections.
* **Real-time Streaming**: Optimized SSE processing with buffering to ensure smooth AI response visualization.

## 🛠 Tech Stack

* **Frontend**: Next.js 16 (App Router), Turbopack, Tailwind CSS, Lucide Icons.
* **Backend**: Next.js API Routes, Puppeteer (for job scraping and PDF generation).
* **AI Engine**: Groq Cloud API (Llama 3.1 8B / 70B models).
* **Deployment**: Render (Docker Runtime).

## ⚙️ Setup and Installation

### 1. Prerequisites
* Node.js 20+
* Groq API Key (from Groq Console)

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_API_URL=[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)
OLLAMA_MODEL=llama-3.1-8b-instant
```

### 3. Installation

```bash
npm install
npm run dev
```

## Deployment (Docker / Render)

1. **Service Creation**  
   Select **Docker** as the Runtime when creating a New Web Service on [Render](https://render.com).

2. **Environment Variables on Render**
    - `GROQ_API_KEY`: Your production API key
    - `PUPPETEER_EXECUTABLE_PATH`: `/usr/bin/google-chrome-stable`
    - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: `true`

## Project Structure

- `src/app/api/analyze`: Logic for resume parsing and Groq API streaming.
- `src/app/api/pdf`: Service for generating A4 PDF documents from Markdown content.
- `src/components/OutputArea`: Real-time report visualization with Markdown support.
- `src/lib/prompts`: Refined system instructions for the AI recruiter and career coach.

## License

This project is licensed under the MIT License.

