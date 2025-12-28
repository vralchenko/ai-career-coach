# AI Career Coach 🤖💼

A professional tool designed to analyze the alignment between a resume and job requirements. The system uses AI to conduct a deep comparison of skills, identify critical gaps, and prepare candidates for interviews.

## 🚀 Key Features

* **Smart Analysis**: Compares PDF resumes with job descriptions directly from a URL.
* **Interview Roadmap**: Automatically generates 5 technical questions based on identified gaps with expected answers.
* **Multi-language Support**: Full support for English, Russian, Ukrainian, German, and Spanish.
* **PDF Export**: Save a beautifully formatted analysis report with color-coded sections.
* **Real-time Streaming**: Optimized SSE processing with buffering to ensure smooth AI response visualization.

## 🛠 Tech Stack

* **Frontend**: Next.js 16 (App Router), Turbopack, Tailwind CSS 4, Lucide React.
* **Backend**: Next.js API Routes, Puppeteer (for job scraping and PDF generation).
* **AI Engine**: Groq API (Llama 3.1 8B / 70B models).
* **Deployment**: Render (Docker Runtime).

## ⚙️ Setup and Installation

### Prerequisites
- Node.js 20+
- Groq API key from https://console.groq.com/keys

### Environment Variables
Create a `.env` file in the root directory:

```env
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_API_KEY=your_key_here
OLLAMA_MODEL=llama3.1-8b-instruct  # optional, requires Ollama
```

### Local Development
1. `npm ci`
2. `npm run dev` (localhost:3000)
3. Build: `npm run build && npm start`
- Prerequisites and `.env` setup in previous sections.

## Docker Deployment

1. **Service Creation**  
   Select **Docker** as the Runtime when creating a New Web Service on [Render](https://render.com).

**Environment Variables**
    - `GROQ_API_KEY`: Your production API key
    - `PUPPETEER_EXECUTABLE_PATH`: `/usr/bin/google-chrome-stable`
    - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: `true`

## Project Structure

- `src/app/api/analyze`: Logic for resume parsing and Groq API streaming.
- `src/app/api/pdf`: Service for generating A4 PDF documents from Markdown content.
- `src/components/OutputArea`: Real-time report visualization with Markdown support.
- `src/utils/prompts`: Refined system instructions for the AI recruiter and career coach.

## Additional Development Information

### Code Style & Linting
- ESLint 9 (flat config): `npm run lint`
- Tailwind CSS 4 (Oxide engine): `@tailwindcss/postcss`
- TypeScript 5, strict mode

### Frameworks & Plugins
- **React 19 + Compiler**: `babel-plugin-react-compiler` (optimizes without memos)
- **Next.js 16 App Router**
- **Dark Mode**: `next-themes`
- **Icons**: `lucide-react`
- **Markdown**: `react-markdown` + `remark-gfm`

### Key Implementation Details
- **Analysis**: URL scrape (Puppeteer) → Resume parse (pdfjs-dist) → AI (Groq/Ollama) → SSE
- **Prompts**: `src/utils/prompts.ts`
- **History**: localStorage, custom events
- **Export**: `html-to-image` + `jsPDF`
- **i18n**: Manual `t` prop (translation objects)

### Debugging Tips
- Puppeteer: `headless: false`
- Ollama: `ollama serve & ollama pull llama3.1-8b-instruct`
- Logs: console in dev

## License

This project is licensed under the MIT License.

