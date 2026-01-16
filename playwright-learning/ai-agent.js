import 'dotenv/config';
import { DynamicTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { chromium } from 'playwright';

/**
 * 🤖 SIMPLE AI AGENT WITH JOB SCRAPER
 */

// 1. Create the job scraper tool
const jobScraperTool = new DynamicTool({
    name: "job_scraper",
    description: "Scrapes job listings from website",

    func: async (input) => {
        console.log('🔧 Scraping jobs...');

        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();

        try {
            await page.goto('https://realpython.github.io/fake-jobs/');
            await page.waitForSelector('.card', { timeout: 10000 });

            const jobCards = await page.locator('.card').all();
            const jobs = [];

            for (const card of jobCards) {
                const title = (await card.locator('h2').textContent()).trim();
                const company = (await card.locator('.company').textContent()).trim();
                const location = (await card.locator('.location').textContent()).trim();

                jobs.push({ title, company, location });
            }

            await browser.close();
            return JSON.stringify(jobs.slice(0, 10), null, 2);

        } catch (error) {
            await browser.close();
            return `Error: ${error.message}`;
        }
    }
});

// 2. Initialize Gemini model
const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",  // Current available model
    temperature: 0
});

// 3. Simple agent function
async function runAgent(userInput) {
    console.log(`\n🤖 User: ${userInput}\n`);

    // Scrape jobs first
    console.log('🔧 Calling job scraper...\n');
    const jobData = await jobScraperTool.func('');

    console.log('📊 Jobs scraped! Asking AI to analyze...\n');

    // Ask AI to answer based on job data
    const response = await model.invoke(`
        You are a helpful job search assistant.
        
        Here are the available jobs:
        ${jobData}
        
        User question: ${userInput}
        
        Based on the job data above, please answer the user's question.
    `);

    return response.content;
}

// 4. Test the agent
console.log('🤖 AI Agent is ready!\n');

const result = await runAgent("Find me Python developer jobs");

console.log('✅ Agent Response:');
console.log(result);
