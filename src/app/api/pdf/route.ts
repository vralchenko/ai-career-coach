import puppeteer from 'puppeteer';

export async function POST(req: Request) {
    try {
        const { html } = await req.json();
        const isDocker = process.env.PUPPETEER_EXECUTABLE_PATH !== undefined;

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: isDocker ? [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--font-render-hinting=none'
            ] : []
        });

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 30000
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
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