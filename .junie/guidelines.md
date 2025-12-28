## ⚠️ Critical Constraints & Rules

### 1. Code Preservation & Refactoring
- **Never delete** existing functions, utility logic, or components unless explicitly requested for a complete rewrite.
- Before modifying a file, **scan for dependencies** to ensure that removing or renaming a variable won't break other components (e.g., ensuring `Actor-Critic` prompts stay linked).
- If a task is ambiguous, **ask for clarification** in "Ask Mode" before applying changes in "Code Mode".

### 2. Language & Localization
- **English Only**: All code comments, JSDoc, console logs, and commit messages must be in English.
- **No Russian comments**: If you find existing Russian comments, you may translate them to English, but never add new ones.
- **UI Translations**: Maintain the existing i18n structure using the `t` prop and translation objects. Do not hardcode strings in components.

### 3. AI Architecture (Actor-Critic)
- Always respect the **Actor-Critic pattern** established in `src/app/api/analyze/route.ts` and `src/utils/prompts.ts`.
- The Critic stage must always verify the presence of the [USER_PHOTO_HERE] placeholder and exact contact details (e.g., email `vr@r-al.ch`).
- **No Markdown Tables**: AI responses for Match Scores must use bullet points and headers only to ensure mobile responsiveness.

### 4. Code Style
- Maintain **Tailwind CSS 4** utility-first approach.
- Use **Lucide React** for icons and follow the minimalist, dark-themed UI aesthetic.

# Development Guidelines

## Build/Configuration Instructions

### Prerequisites
- Node.js 20+
- Groq API key from https://console.groq.com/keys

### Local Development
1. `npm ci`
2. Copy `.env` and set `GROQ_API_KEY=your_key_here`
   ```
   GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
   GROQ_API_KEY=...
   OLLAMA_MODEL=llama3.1-8b-instruct  # optional, requires Ollama
   ```
3. `npm run dev` (localhost:3000)
4. Build: `npm run build && npm start`

### Docker Deployment
Use Dockerfile. Env vars:
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable` (Render/etc.)
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`

## Testing Information

### Current Setup
No unit/E2E tests or test runner configured.

### Demo Simple Test
File: `tests/simple.test.js`
```js
const assert = require('node:assert/strict');

assert.strictEqual(1 + 1, 2);
console.log('✅ All tests passed!');
```
Run:
```bash
node tests/simple.test.js
```
Output: `✅ All tests passed!`

### Adding Unit Tests (Vitest recommended for Next.js 16+)
1. Install:
   ```bash
   npm i -D vitest@latest jsdom@latest @testing-library/react @testing-library/jest-dom @vitest/ui happy-dom
   ```
2. `package.json` scripts:

3. `vitest.config.ts`:
   ```ts
   import { defineConfig } from 'vitest/config'

   export default defineConfig({
     test: {
       environment: 'happy-dom',  // or jsdom
       include: ['**/*.{test,spec}.{ts,tsx}']
     }
   })
   ```
4. Example test `src/__tests__/Sidebar.test.tsx`:
   ```tsx
   import { render, screen } from '@testing-library/react'
   // test code here
   ```
5. Run `npm test`

### E2E Testing
Puppeteer pre-installed for scraping. For full E2E:
```bash
npm i -D @playwright/test
npx playwright install
```
Configure `playwright.config.ts`.

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