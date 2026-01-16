const { chromium } = require('playwright');
const fs = require('fs');  // NEW!

async function scrapeJobs() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://realpython.github.io/fake-jobs/');

    const jobCards = await page.locator('.card').all();

    const jobs = [];

    for (const card of jobCards) {
        const title = await card.locator('h2').textContent();
        const company = await card.locator('.company').textContent();
        const location = await card.locator('.location').textContent();
        const link = await card.locator('a').nth(1).getAttribute('href');

        jobs.push({ title, company, location, link });
    }

    console.log(jobs);
    console.log(`Total jobs found: ${jobs.length}`);

    // Save to JSON file - NEW!
    fs.writeFileSync('jobs.json', JSON.stringify(jobs, null, 2));
    console.log('✅ Saved to jobs.json');

    await browser.close();
}

scrapeJobs();