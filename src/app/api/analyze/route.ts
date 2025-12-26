import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import {
    SYSTEM_PROMPT,
    USER_PROMPT,
    CRITIC_SYSTEM_PROMPT,
    CRITIC_USER_PROMPT
} from '@/utils/prompts';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const resumeText = formData.get('resume') as string;
        const jobDescription = formData.get('jobUrl') as string;
        const language = formData.get('language') as string || 'en';

        if (!resumeText || !jobDescription) {
            return new Response(JSON.stringify({ error: 'Missing content' }), { status: 400 });
        }

        const stream = new ReadableStream({
            async start(controller) {
                // ACTOR PHASE
                const actorResponse = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT(language) },
                        { role: "user", content: USER_PROMPT(resumeText, jobDescription) }
                    ],
                    temperature: 0.3,
                });

                const draftAnalysis = actorResponse.choices[0]?.message?.content || "";

                // CRITIC PHASE
                const criticStream = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: CRITIC_SYSTEM_PROMPT(language) },
                        { role: "user", content: CRITIC_USER_PROMPT(resumeText, jobDescription, draftAnalysis) }
                    ],
                    temperature: 0.1,
                    stream: true,
                });

                for await (const chunk of criticStream) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        const payload = { choices: [{ delta: { content } }] };
                        controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`);
                    }
                }

                controller.enqueue("data: [DONE]\n\n");
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Analysis Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}