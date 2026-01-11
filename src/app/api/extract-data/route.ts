import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { DATA_EXTRACTION_PROMPT } from '@/utils/prompts';
import { checkRateLimit } from '@/utils/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        const { error: limitError, status: limitStatus } = await checkRateLimit(ip, 20);
        if (limitError) return new Response(JSON.stringify({ error: limitError }), { status: limitStatus });

        const { resumeText, analysisText, lang = 'en' } = await req.json();
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const response = await groq.chat.completions.create({
            model: process.env.AI_MODEL_NAME || "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: DATA_EXTRACTION_PROMPT(lang) },
                { role: "user", content: `Resume: ${resumeText}\n\nAnalysis: ${analysisText}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        return new Response(response.choices[0].message.content, {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}