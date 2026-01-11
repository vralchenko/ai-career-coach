import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { marked } from 'marked';
import { checkRateLimit } from '@/utils/rateLimit';

export async function POST(req: Request) {
    let browser;
    try {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        const { error: limitError, status: limitStatus } = await checkRateLimit(ip, 20);
        if (limitError) return new Response(JSON.stringify({ error: limitError }), { status: limitStatus });

        const { html: markdownText, lang = 'en' } = await req.json();

        if (!markdownText || markdownText.trim() === "" || markdownText === "undefined") {
            return new Response("Error: Content is empty", { status: 400 });
        }

        // Fix: Removed redundant await as marked.parse is synchronous
        const contentHtml = marked.parse(markdownText);

        const finalHtml = `
            <!DOCTYPE html>
            <html lang="${lang}">
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                    body { 
                        font-family: 'Inter', -apple-system, sans-serif; 
                        color: #1e293b; 
                        line-height: 1.5; 
                        font-size: 12px;
                    }
                    .container { max-width: 800px; margin: 0 auto; }
                    h1 { color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 20px; font-weight: 800; font-size: 20px; }
                    h2 { color: #4f46e5; margin-top: 16px; font-weight: 600; font-size: 16px; border-left: 4px solid #4f46e5; padding-left: 8px; }
                    h3 { font-size: 14px; margin-top: 12px; color: #1e293b; }
                    p { margin-bottom: 8px; }
                    ul, ol { padding-left: 20px; margin-bottom: 12px; }
                    li { margin-bottom: 4px; }
                    li > p { margin-bottom: 0; display: inline; }
                    ul { list-style-type: disc; }
                    ul ul { list-style-type: circle; margin-top: 4px; }
                    ol { list-style-type: decimal; }
                    strong { color: #0f172a; font-weight: 600; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
                    th, td { border: 1px solid #e2e8f0; padding: 6px; text-align: left; }
                    th { background-color: #f8fafc; font-weight: 600; }
                    .page-break { page-break-before: always; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${contentHtml}
                </div>
            </body>
            </html>
        `;

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: (chromium as any).defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: true,
        });

        const page = await browser.newPage();
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
        });

        return new Response(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="analysis.pdf"'
            }
        });
    } catch (e: any) {
        return new Response(`PDF Error: ${e.message}`, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }
}