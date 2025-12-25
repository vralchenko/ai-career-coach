# AI Career Coach 🚀 (Local LLM Edition)

AI Career Coach is a high-performance web application designed to analyze resumes against job descriptions. This version is built to run entirely on your local infrastructure using **Ollama**, ensuring your sensitive resume data never leaves your machine.

## ✨ Features

- **Privacy First**: All processing is done locally via Ollama; no external AI APIs are required.
- **Real-time Streaming**: Experience near-instant feedback as the AI generates the analysis report word-by-word.
- **Match Score Indicator**: A visual breakdown of how well you align with the job requirements.
- **Comprehensive Sections**:
    - 🎯 Executive Summary
    - 📊 Match Score Breakdown (mathematical justification)
    - ⏳ Key Experience Analysis
    - 🛠 Tech Stack Comparison (✅/⚠️/❌)
    - 🚀 Strengths & ⚠️ Critical Gaps
    - 🎤 Interview Roadmap (5 technical questions with expected answers)
- **Export to PDF**: Save your tailored analysis as a professional multi-page PDF document.
- **Persistent History**: Your analysis history is saved locally in your browser for quick access.
- **Multi-language Support**: Fully localized for English, German, Spanish, Russian, and Ukrainian.

## 🛠 Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **LLM Engine**: [Ollama](https://ollama.com/)
- **Model**: `llama3.1:8b` (Optimized for technical recruiting analysis)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [html-to-image](https://github.com/bubkoo/html-to-image)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

1.  **Install Ollama**: Download and install from [ollama.com](https://ollama.com/).
2.  **Pull the Model**:
    ```bash
    ollama pull llama3.1:8b
    ```
3.  **Environment Setup**: Ensure Ollama is running. If you face CORS issues, start Ollama with:
    ```bash
    OLLAMA_ORIGINS="*" ollama serve
    ```

### Installation

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/your-username/ai-career-coach.git](https://github.com/your-username/ai-career-coach.git)
    cd ai-career-coach
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory:
    ```env
    OLLAMA_HOST=http://localhost:11434
    OLLAMA_MODEL=llama3.1:8b
    ```

4.  **Launch the App**:
    ```bash
    npm run dev
    ```

5.  **Access the Dashboard**:
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Configuration

The AI's logic and report structure are defined in `src/lib/prompts.ts`. You can modify the `SYSTEM_PROMPT` to change how the model evaluates candidates or to add new sections to the report.

## 📄 License

This project is licensed under the MIT License.

---
*Helping you land your dream job, one local token at a time.* 