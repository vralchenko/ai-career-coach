import puppeteer from 'puppeteer';
import { marked } from 'marked';

export async function POST(req: Request) {
    try {
        const { html: markdownText, lang = 'en' } = await req.json();

        if (!markdownText || markdownText.trim() === "" || markdownText === "undefined") {
            return new Response("Error: Content is empty", { status: 400 });
        }

        const contentHtml = marked.parse(markdownText);

        const finalHtml = `
            <!DOCTYPE html>
            <html lang="${lang}">
            <head>
                <meta charset="UTF-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                    body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; }
                    h1 { color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 24px; font-weight: 900; }
                    h2 { color: #4f46e5; margin-top: 20px; font-weight: 700; display: flex; align-items: center; }
                    ul { margin-bottom: 16px; }
                    li { margin-bottom: 8px; position: relative; padding-left: 20px; }
                    li::before { content: "•"; color: #6366f1; position: absolute; left: 0; font-weight: bold; }
                    strong { color: #0f172a; font-weight: 700; }
                    p { margin-bottom: 12px; }
                </style>
            </head>
            <body class="p-10 bg-white">
                <div class="max-w-4xl mx-auto">
                    ${contentHtml}
                </div>
            </body>
            </html>
        `;

        const isDocker = process.env.PUPPETEER_EXECUTABLE_PATH !== undefined;
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: isDocker ? [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ] : []
        });

        const page = await browser.newPage();
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        await browser.close();

        return new Response(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="analysis.pdf"'
            }
        });
    } catch (e: any) {
        return new Response(`PDF Error: ${e.message}`, { status: 500 });
    }
}