import { DynamicTool } from "@langchain/core/tools";
import { chromium } from 'playwright';

/**
 * 🎯 JOB SCRAPER TOOL
 * 
 * This is your Playwright scraper wrapped as a LangChain tool.
 * An AI agent can now use this to scrape job listings!
 */

const jobScraperTool = new DynamicTool({
    name: "job_scraper",
    description: "Scrapes job listings from the fake jobs practice website. Returns an array of jobs with title, company, location, and link.",

    func: async (input) => {
        console.log('🤖 AI Agent called the job scraper tool!');

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            // Navigate to the jobs page
            await page.goto('https://realpython.github.io/fake-jobs/');

            // Wait for jobs to load
            await page.waitForSelector('.card', { timeout: 10000 });

            // Get all job cards
            const jobCards = await page.locator('.card').all();

            const jobs = [];

            // Extract data from each job card
            for (const card of jobCards) {
                const title = (await card.locator('h2').textContent()).trim();
                const company = (await card.locator('.company').textContent()).trim();
                const location = (await card.locator('.location').textContent()).trim();
                const link = await card.locator('a').nth(1).getAttribute('href');

                jobs.push({ title, company, location, link });
            }

            await browser.close();

            // Return as JSON string (LangChain tools must return strings)
            return JSON.stringify(jobs, null, 2);

        } catch (error) {
            await browser.close();
            return `Error scraping jobs: ${error.message}`;
        }
    }
});

// Test the tool directly
console.log('Testing the job scraper tool...\n');
const result = await jobScraperTool.invoke('');
const jobs = JSON.parse(result);
console.log(`✅ Scraped ${jobs.length} jobs!`);
console.log('\nFirst 3 jobs:');
console.log(jobs.slice(0, 3));
