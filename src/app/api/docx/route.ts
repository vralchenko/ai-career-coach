import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { COVER_LETTER_PROMPT } from '@/utils/prompts';

export async function POST(req: NextRequest) {
    try {
        const { report, lang = 'en' } = await req.json();
        const apiKey = process.env.GROQ_API_KEY;
        const modelName = process.env.AI_MODEL_NAME || "llama-3.3-70b-versatile";

        if (!apiKey) return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500 });

        const metaMatch = report.match(/COMPANY:\s*(.*?)\s*\|\s*POSITION:\s*(.*)$/m);
        const company = metaMatch ? metaMatch[1].trim() : "the Company";

        const nameMatch = report.match(/\*\*Candidate:\*\*\s*([^\n]+)/i) ||
            report.match(/(?:Candidate|Name|Кандидат|Имя):\s*([^\n|]+)/i);
        const candidateName = nameMatch ? nameMatch[1].replace(/[*]/g, '').trim() : "Candidate";

        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: COVER_LETTER_PROMPT(lang, candidateName, company) },
                { role: "user", content: `Context:\n${report}` }
            ],
            temperature: 0.3,
        });

        const letterText = completion.choices[0]?.message?.content || "";
        const lines = letterText.split('\n').map(l => l.trim()).filter(l => l !== "");

        const children = lines.map((line) => {
            const isClosing = line.toLowerCase().includes("sincerely") ||
                line.toLowerCase().includes("freundliche grüsse") ||
                line.toLowerCase().includes("с уважением");

            const parts = line.split(/(\*\*.*?\*\*)/g);
            return new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 320, after: isClosing ? 0 : 120, before: isClosing ? 480 : 0 },
                children: parts.map(part => {
                    const isBold = part.startsWith('**') && part.endsWith('**');
                    return new TextRun({
                        text: isBold ? part.replace(/\*\*/g, '') : part,
                        bold: isBold,
                        size: 23,
                        font: "Arial"
                    });
                })
            });
        });

        const doc = new Document({
            sections: [{
                properties: { page: { margin: { top: 1140, right: 1140, bottom: 1140, left: 1140 } } },
                children: children,
            }],
        });

        const baseFileName = lang === 'de' ? 'Bewerbung' : 'Cover_Letter';
        const finalFileName = `${baseFileName}_${candidateName.replace(/\s+/g, '_')}.docx`;

        const buffer = await Packer.toBuffer(doc);
        return new Response(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(finalFileName)}"`,
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}