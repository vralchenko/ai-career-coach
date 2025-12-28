import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import puppeteer from 'puppeteer';
import {
    SYSTEM_PROMPT, USER_PROMPT,
    TAILOR_SYSTEM_PROMPT, TAILOR_USER_PROMPT,
    CRITIC_SYSTEM_PROMPT, CRITIC_USER_PROMPT
} from '@/utils/prompts';

export const dynamic = 'force-dynamic';

async function getJobDescription(url: string): Promise<string> {
    if (!url.startsWith('http')) return url;
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
    try {
        const page = await browser.newPage();
        await page.setUserAgent({ userAgent: 'Mozilla/5.0' });
        await page.goto(url, { waitUntil: 'networkidle2' });
        return await page.evaluate(() => {
            const selectors = ['.description__text', '.show-more-less-html__markup', '[class*="description"]'];
            for (const s of selectors) {
                const el = document.querySelector(s);
                if (el) return (el as HTMLElement).innerText;
            }
            return document.body.innerText;
        });
    } catch (e) { return url; } finally { await browser.close(); }
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        const modelName = process.env.OLLAMA_MODEL || "llama-3.1-8b-instant";
        const groq = new Groq({ apiKey });

        const formData = await req.formData();
        const resumeText = formData.get('resume') as string;
        const jobInput = formData.get('jobUrl') as string;
        const lang = formData.get('language') as string || 'en';
        const mode = formData.get('mode') as string || 'analyze';
        const isTailor = mode === 'tailor';

        const jobDescription = await getJobDescription(jobInput);
        const actorSys = isTailor ? TAILOR_SYSTEM_PROMPT(lang) : SYSTEM_PROMPT(lang);
        const actorUsr = isTailor ? TAILOR_USER_PROMPT(resumeText, jobDescription) : USER_PROMPT(resumeText, jobDescription);

        const actorRes = await groq.chat.completions.create({
            model: modelName,
            messages: [{ role: "system", content: actorSys }, { role: "user", content: actorUsr }],
            temperature: 0.3,
            stream: false
        });

        const draft = actorRes.choices[0]?.message?.content || "";

        const stream = new ReadableStream({
            async start(controller) {
                const criticStream: any = await groq.chat.completions.create({
                    model: modelName,
                    messages: [
                        { role: "system", content: CRITIC_SYSTEM_PROMPT(lang, isTailor) },
                        { role: "user", content: CRITIC_USER_PROMPT(resumeText, jobDescription, draft) }
                    ],
                    temperature: 0.1,
                    stream: true,
                    ...({ stream_options: { include_usage: true } } as any)
                });

                for await (const chunk of criticStream) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    const usage = chunk.usage || null;
                    controller.enqueue(`data: ${JSON.stringify({ choices: [{ delta: { content } }], usage })}\n\n`);
                }
                controller.enqueue("data: [DONE]\n\n");
                controller.close();
            },
        });

        return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}