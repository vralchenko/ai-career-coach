import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { COVER_LETTER_PROMPT } from '@/utils/prompts';

export async function POST(req: NextRequest) {
    try {
        const { report, lang = 'en' } = await req.json();

        const apiKey = process.env.GROQ_API_KEY;
        const modelName = process.env.AI_MODEL_NAME || "llama-3.3-70b-versatile";

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500 });
        }

        const groq = new Groq({ apiKey });

        const completion = await groq.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: COVER_LETTER_PROMPT(lang) },
                { role: "user", content: `Analysis Context:\n${report}` }
            ],
            temperature: 0.4,
        });

        const letterText = completion.choices[0]?.message?.content || "";

        const lines = letterText.split('\n').map(l => l.trim()).filter(l => l !== "");

        const children = lines.map((line) => {
            const isSignatureStart =
                line.toLowerCase().startsWith('sincerely') ||
                line.toLowerCase().startsWith('с уважением') ||
                line.toLowerCase().startsWith('mit freundlichen grüßen') ||
                line.toLowerCase().startsWith('atentamente');

            const parts = line.split(/(\*\*.*?\*\*)/g);
            const textRuns = parts.map(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new TextRun({
                        text: part.replace(/\*\*/g, ''),
                        bold: true,
                        size: 23,
                        font: "Arial"
                    });
                }
                return new TextRun({
                    text: part,
                    size: 23,
                    font: "Arial"
                });
            });

            return new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: {
                    line: 320,
                    after: 120,
                    before: isSignatureStart ? 240 : 0
                },
                children: textRuns
            });
        });

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 1140, right: 1140, bottom: 1140, left: 1140 },
                    },
                },
                children: children,
            }],
        });

        const buffer = await Packer.toBuffer(doc);
        const uint8Array = new Uint8Array(buffer);

        return new Response(uint8Array, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="Cover_Letter.docx"',
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}