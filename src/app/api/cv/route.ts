import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { CV_PROMPT } from '@/utils/prompts';
import { checkRateLimit } from '@/utils/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        const { error: limitError, status: limitStatus } = await checkRateLimit(ip, 20);
        if (limitError) return new Response(JSON.stringify({ error: limitError }), { status: limitStatus });

        const { tailoredData, lang = 'en' } = await req.json();
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500 });

        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
            model: process.env.AI_MODEL_NAME || "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: CV_PROMPT(lang, tailoredData) },
                { role: "user", content: "Generate the CV based on the provided structured data." }
            ],
            temperature: 0.2,
        });

        const cvText = completion.choices[0]?.message?.content || "";
        const lines = cvText.split('\n').map(l => l.trim()).filter(l => l !== "");

        const children = lines.map((line) => {
            const isHeader = line.startsWith('#') || (line.toUpperCase() === line && line.length > 5);
            const cleanLine = line.replace(/^#+\s*/, '');
            const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

            return new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 300, before: isHeader ? 240 : 0, after: 120 },
                children: parts.map(part => {
                    const isBold = part.startsWith('**') && part.endsWith('**');
                    return new TextRun({
                        text: isBold ? part.replace(/\*\*/g, '') : part,
                        bold: isBold || (isHeader && !line.includes(tailoredData.candidate.full_name)),
                        size: isHeader ? 26 : 22,
                        font: "Arial"
                    });
                })
            });
        });

        const doc = new Document({
            sections: [{
                properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
                children: children,
            }],
        });

        const buffer = await Packer.toBuffer(doc);
        return new Response(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="Tailored_CV.docx"`,
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}