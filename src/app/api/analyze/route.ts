import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import puppeteer from 'puppeteer';
import {
    SYSTEM_PROMPT,
    USER_PROMPT,
    CRITIC_SYSTEM_PROMPT,
    CRITIC_USER_PROMPT,
    CLEANUP_PROMPT
} from '@/utils/prompts';
import crypto from 'crypto';
import { supabaseAdmin } from '@/utils/supabaseClient';
import geoip from 'fast-geoip';
import { checkRateLimit } from '@/utils/rateLimit';
import { parseUserAgent } from '@/utils/uaParser';

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

        const userAgentRaw = req.headers.get('user-agent') || 'unknown';
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        const { error: limitError, status: limitStatus } = await checkRateLimit(ip, 20);
        if (limitError) return new Response(JSON.stringify({ error: limitError }), { status: limitStatus });

        const geo = await geoip.lookup(ip);
        const country = geo?.country || 'Unknown';
        const city = geo?.city || 'Unknown';
        const sessionId = crypto.randomUUID();
        const model = process.env.AI_MODEL_NAME || 'llama-3.1-8b-instant';

        const cleanupResponse = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: "system", content: CLEANUP_PROMPT },
                { role: "user", content: resumeText },
            ],
            temperature: 0.0,
        });
        const cleanedResumeText = cleanupResponse.choices[0]?.message?.content?.trim() || resumeText;
        const jobDescription = await getJobDescription(jobInput);

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const actorResponse = await groq.chat.completions.create({
                        model,
                        messages: [
                            { role: "system", content: SYSTEM_PROMPT(language) },
                            { role: "user", content: USER_PROMPT(cleanedResumeText, jobDescription) }
                        ],
                        temperature: 0.3,
                    });

                    const draftAnalysis = actorResponse.choices[0]?.message?.content || "";
                    const actorTokens = actorResponse.usage?.total_tokens ?? 0;
                    controller.enqueue(`data: ${JSON.stringify({ tokens: { actor: actorTokens } })}\n\n`);

                    let fullCriticContent = "";
                    const criticStream = await groq.chat.completions.create({
                        model,
                        messages: [
                            { role: "system", content: CRITIC_SYSTEM_PROMPT(language) },
                            { role: "user", content: CRITIC_USER_PROMPT(cleanedResumeText, jobDescription, draftAnalysis) }
                        ],
                        temperature: 0.1,
                        stream: true,
                    });

                    for await (const chunk of criticStream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            fullCriticContent += content;
                            controller.enqueue(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
                        }
                    }

                    const criticUsageResponse = await groq.chat.completions.create({
                        model,
                        messages: [
                            { role: "system", content: CRITIC_SYSTEM_PROMPT(language) },
                            { role: "user", content: CRITIC_USER_PROMPT(cleanedResumeText, jobDescription, draftAnalysis) }
                        ],
                        max_tokens: 1,
                    });

                    const criticTokens = criticUsageResponse.usage?.total_tokens ?? 0;
                    const totalTokens = actorTokens + criticTokens;

                    if (supabaseAdmin) {
                        const logData = {
                            job_url: jobInput,
                            job_raw_text: jobDescription,
                            resume_raw_text: cleanedResumeText,
                            recommendations: fullCriticContent,
                            tokens_actor: actorTokens,
                            tokens_critic: criticTokens,
                            tokens_total: totalTokens,
                            api_provider: 'Groq',
                            api_model: model,
                            ip_address: ip,
                            user_agent: {
                                ...parseUserAgent(userAgentRaw),
                                country,
                                city,
                            },
                            session_id: sessionId,
                        };
                        await supabaseAdmin.from('analysis_logs').insert([logData]);
                    }

                    controller.enqueue(`data: ${JSON.stringify({ tokens: { actor: actorTokens, critic: criticTokens, total: totalTokens } })}\n\n`);
                    controller.enqueue("data: [DONE]\n\n");
                    controller.close();
                } catch (e: any) {
                    controller.error(e);
                }
            },
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
        });
    } catch (error: any) {
        const msg = error.response?.data?.error?.message || error.message || "Internal Error";
        return new Response(JSON.stringify({ error: msg }), { status: error.status || 500 });
    }
}