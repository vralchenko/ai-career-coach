import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { CV_PROMPT } from '@/utils/prompts';
import { checkRateLimit } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

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
                { role: "user", content: "Generate the CV content." }
            ],
            temperature: 0.1,
        });

        const cvText = completion.choices[0]?.message?.content || "";
        const lines = cvText.split('\n').map(l => l.trim()).filter(l => l !== "");

        const children = lines.map((line) => {
            const isName = line.startsWith('# ');
            const isPosition = line.startsWith('> ');
            const isSection = line.startsWith('## ');
            const isRole = line.startsWith('### ');

            let cleanLine = line.replace(/^[#> ]+\s*/, '').replace(/[\[\]\(\)]/g, '');

            const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

            return new Paragraph({
                alignment: (isName || isPosition) ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
                spacing: {
                    line: 300,
                    before: isName ? 0 : (isSection ? 400 : (isRole ? 200 : 100)),
                    after: isName ? 200 : (isSection ? 200 : 120)
                },
                children: parts.map(part => {
                    const isMarkdownBold = part.startsWith('**') && part.endsWith('**');
                    let fontSize = 22;

                    if (isName) fontSize = 56;
                    else if (isPosition) fontSize = 32;
                    else if (isSection) fontSize = 28;
                    else if (isRole) fontSize = 24;

                    return new TextRun({
                        text: isMarkdownBold ? part.replace(/\*\*/g, '') : part,
                        bold: isMarkdownBold || isName || isPosition || isSection || isRole,
                        size: fontSize,
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
        const rawName = tailoredData?.candidate?.full_name || 'Candidate';
        const safeCandidateName = rawName.trim().replace(/\s+/g, ' ').replace(/[^a-zA-Zа-яА-Я0-9 ]/g, '').replace(/ /g, '_');
        const baseName = lang === 'de' ? 'Lebenslauf' : 'CV';
        const finalFileName = `${baseName}_${safeCandidateName}.docx`;

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