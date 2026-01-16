const { chromium } = require('playwright');

async function scrapeAllJobs() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://example-job-site.com');

    // Keep clicking "Load More" until it's gone
    while (true) {
        const loadMore = page.locator('button.load-more');
        const exists = await loadMore.count() > 0;

        if (!exists) break;

        await loadMore.click();
        await page.waitForTimeout(2000);
        console.log('Clicked Load More...');
    }

    // Now scrape ALL jobs
    const jobs = await page.locator('.job-card').all();
    console.log(`Total jobs: ${jobs.length}`);

    await browser.close();
}