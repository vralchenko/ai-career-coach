import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import puppeteer from 'puppeteer';
import {
    SYSTEM_PROMPT,
    USER_PROMPT,
    CRITIC_SYSTEM_PROMPT,
    CRITIC_USER_PROMPT
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
        await page.setUserAgent({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
        await page.goto(url, { waitUntil: 'networkidle2' });
        return await page.evaluate(() => {
            const selectors = ['.description__text', '.show-more-less-html__markup', '[class*="description"]', '#job-details'];
            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) return (el as HTMLElement).innerText;
            }
            return document.body.innerText;
        });
    } catch (error) { return url; } finally { await browser.close(); }
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 500 });
        const groq = new Groq({ apiKey });
        const formData = await req.formData();
        const resumeText = formData.get('resume') as string;
        const jobInput = formData.get('jobUrl') as string;
        const language = formData.get('language') as string || 'en';
        const jobDescription = await getJobDescription(jobInput);
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const actorResponse = await groq.chat.completions.create({
                        model: "llama-3.3-70b-versatile",
                        messages: [{ role: "system", content: SYSTEM_PROMPT(language) }, { role: "user", content: USER_PROMPT(resumeText, jobDescription) }],
                        temperature: 0.3,
                    });
                    const draftAnalysis = actorResponse.choices[0]?.message?.content || "";
                    const criticStream = await groq.chat.completions.create({
                        model: "llama-3.3-70b-versatile",
                        messages: [{ role: "system", content: CRITIC_SYSTEM_PROMPT(language) }, { role: "user", content: CRITIC_USER_PROMPT(resumeText, jobDescription, draftAnalysis) }],
                        temperature: 0.1,
                        stream: true,
                    });
                    for await (const chunk of criticStream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            controller.enqueue(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
                        }
                    }
                    controller.enqueue("data: [DONE]\n\n");
                    controller.close();
                } catch (e: any) { controller.error(e); }
            },
        });
        return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
    } catch (error: any) {
        const msg = error.response?.data?.error?.message || error.message || "Internal Error";
        return new Response(JSON.stringify({ error: msg }), { status: error.status || 500 });
    }
}