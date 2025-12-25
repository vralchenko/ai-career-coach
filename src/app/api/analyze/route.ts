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

        let jobText = "";
        try {
            const browser = await puppeteer.launch({
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process'
                ]
            });
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            jobText = await page.evaluate(() => document.body.innerText.substring(0, 10000));
            await browser.close();
        } catch (puppeteerError: any) {
            console.error('PUPPETEER ERROR:', puppeteerError.message);
            throw new Error(`Browser Error: ${puppeteerError.message}`);
        }

        const ollama = new Ollama({ host: process.env.OLLAMA_HOST });

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
                try {
                    for await (const part of response) {
                        controller.enqueue(encoder.encode(part.message.content));
                    }
                    controller.close();
                } catch (err: any) {
                    controller.error(err);
                }
            },
        });

        return new Response(stream);
    } catch (e: any) {
        console.error('GLOBAL API ERROR:', e.message);
        return new Response(`Analysis failed: ${e.message}`, { status: 500 });
    }
}