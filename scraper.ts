import puppeteer from 'puppeteer';

/**
 * Opens a URL in a headless browser and extracts text content
 * @param url The job posting URL (LinkedIn, SwissDevJobs, etc.)
 */
export async function scrapeJobDescription(url: string): Promise<string> {
    console.log(`🌐 Opening browser for: ${url}...`);

    // Launch a headless browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Set a realistic User-Agent to avoid simple bot detection
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Logic for SwissDevJobs (usually easier to scrape)
        // Logic for LinkedIn (requires waiting for specific description selectors)
        let selector = 'body';
        if (url.includes('linkedin.com')) {
            selector = '.description__text, .show-more-less-html__markup'; // Common LinkedIn selectors
        } else if (url.includes('swissdevjobs.ch')) {
            selector = '.job-description'; // General class for this board
        }

        await page.waitForSelector(selector, { timeout: 10000 }).catch(() => null);

        // Extract text content from the identified area
        const text = await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            return element ? (element as HTMLElement).innerText : document.body.innerText;
        }, selector);

        await browser.close();
        return text.trim();
    } catch (error) {
        console.error("Scraping error:", error);
        await browser.close();
        return "";
    }
}