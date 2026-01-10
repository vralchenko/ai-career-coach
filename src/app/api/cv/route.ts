import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { CV_PROMPT } from '@/utils/prompts';

export async function POST(req: NextRequest) {
    try {
        const { report, lang = 'en' } = await req.json();
        const apiKey = process.env.GROQ_API_KEY;
        const modelName = process.env.AI_MODEL_NAME || "llama-3.3-70b-versatile";

        if (!apiKey) return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500 });

        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: CV_PROMPT(lang) },
                { role: "user", content: `Original Resume/Analysis:\n${report}` }
            ],
            temperature: 0.3,
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
                        bold: isBold || isHeader,
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
        const uint8Array = new Uint8Array(buffer);

        return new Response(uint8Array, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="Viktor_Ralchenko_CV.docx"',
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}