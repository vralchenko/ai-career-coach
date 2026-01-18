import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function getBrowser() {
    let executablePath: string | undefined;

    // 1. Development (Local Mac/Windows)
    if (process.env.NODE_ENV === 'development') {
        executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        // You might want to add Windows/Linux checks here if needed, but for this user Mac is priority
    }
    // 2. Production Environment Check
    else {
        // Check for common specific environments
        const isVercel = !!process.env.VERCEL;
        const isRender = !!process.env.RENDER;

        if (isVercel) {
            // Vercel / AWS Lambda logic using chromium-min
            executablePath = await chromium.executablePath(
                'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
            );
        } else {
            // Render or Standard Docker/VPS
            // In these environments, we expect Chrome to be installed at a standard path
            // or provided via PUPPETEER_EXECUTABLE_PATH
            executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome';
        }
    }

    try {
        return await puppeteer.launch({
            args: process.env.VERCEL ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: chromium.defaultViewport,
            executablePath,
            headless: chromium.headless,
        });
    } catch (error) {
        console.warn('Failed to launch browser with primary config, trying Fallback...', error);
        // Fallback: If verifying on local but path is wrong, or generic failure
        // We re-throw for now as "guessing" paths can be messy.
        throw error;
    }
}
