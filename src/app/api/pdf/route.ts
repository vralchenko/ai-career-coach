import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

export async function POST(req: NextRequest) {
    try {
        const { report } = await req.json();
        const htmlBody = await marked(report);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 50px; line-height: 1.6; color: #333; }
                        h1, h2, h3 { color: #4f46e5; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 20px; }
                        strong { color: #4f46e5; }
                        ul { padding-left: 20px; }
                        li { margin-bottom: 8px; }
                        p { margin-bottom: 15px; }
                    </style>
                </head>
                <body>
                    ${htmlBody}
                </body>
            </html>
        `;

        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=Analysis_Report.pdf',
            },
        });
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}