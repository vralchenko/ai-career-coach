import puppeteer from 'puppeteer';
import { SYSTEM_PROMPT, USER_PROMPT } from '@/lib/prompts';
import pdf from 'pdf-parse-fork';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('resume') as File;
        const jobUrl = formData.get('jobUrl') as string;
        const targetLanguage = (formData.get('language') as string) || 'en';

        if (!file || !jobUrl) return new Response('Missing data', { status: 400 });

        const arrayBuffer = await file.arrayBuffer();
        const resumeData = await pdf(Buffer.from(arrayBuffer));

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
                '--no-zygote'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                { architecture: 'x86', mobile: false, model: '', platform: 'Windows', platformVersion: '10.0.0' }
            );

            await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
            const jobText = await page.evaluate(() => document.body.innerText);
            await browser.close();

            const response = await fetch(process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: process.env.OLLAMA_MODEL || "llama-3.1-8b-instant",
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT(targetLanguage) },
                        { role: 'user', content: USER_PROMPT(resumeData.text, jobText) }
                    ],
                    stream: true,
                })
            });

            if (!response.ok) return new Response('AI Service Error', { status: 500 });
            return new Response(response.body);

        } catch (innerError: any) {
            if (browser) await browser.close();
            return new Response(`Browser error: ${innerError.message}`, { status: 500 });
        }
    } catch (e: any) {
        console.error('Analysis Error:', e);
        return new Response(`Analysis failed: ${e.message}`, { status: 500 });
    }
}