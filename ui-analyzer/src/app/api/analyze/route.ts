import { Ollama } from 'ollama';
import puppeteer from 'puppeteer';
import { createRequire } from 'module';
import { SYSTEM_PROMPT, USER_PROMPT } from '@/lib/prompts';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse-fork');

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const jobUrl = formData.get('jobUrl') as string;
        const resumeFile = formData.get('resume') as File;
        const langCode = (formData.get('lang') as string) || 'en';

        const langMap: Record<string, string> = {
            'ru': 'Russian', 'en': 'English', 'uk': 'Ukrainian', 'de': 'German', 'es': 'Spanish'
        };
        const targetLanguage = langMap[langCode] || 'English';

        const arrayBuffer = await resumeFile.arrayBuffer();
        const resumeData = await pdf(Buffer.from(arrayBuffer));

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        const jobText = await page.evaluate(() => document.body.innerText.substring(0, 12000));
        await browser.close();

        const ollama = new Ollama({ host: process.env.OLLAMA_HOST });

        // Включаем stream: true для мгновенного начала вывода
        const response = await ollama.chat({
            model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT(targetLanguage) },
                { role: 'user', content: USER_PROMPT(resumeData.text, jobText) }
            ],
            stream: true,
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                for await (const part of response) {
                    controller.enqueue(encoder.encode(part.message.content));
                }
                controller.close();
            },
        });

        return new Response(stream);
    } catch (e) {
        return new Response('Analysis failed', { status: 500 });
    }
}