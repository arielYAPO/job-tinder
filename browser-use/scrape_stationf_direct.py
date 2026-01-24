"""
Direct Station F Scraper using Playwright

Scrapes job listings from jobs.stationf.co/search using the correct selectors.
"""

import asyncio
import json
from playwright.async_api import async_playwright


async def scrape_stationf_jobs(max_pages: int = 5, headless: bool = True) -> list[dict]:
    """
    Scrape job listings from Station F job board.
    
    Args:
        max_pages: Maximum number of pages to scrape
        headless: Run browser in headless mode
    
    Returns a list of job dictionaries with:
    - title: Job title
    - company: Company name
    - location: Job location
    - url: Job posting URL
    - description: Brief description
    """
    jobs = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        page = await browser.new_page()
        
        try:
            page_num = 1
            while page_num <= max_pages:
                # Navigate to Station F search page
                url = f"https://jobs.stationf.co/search?page={page_num}"
                print(f"[*] Scraping page {page_num}: {url}")
                await page.goto(url, wait_until="networkidle")
                
                # Wait for job listings to load
                try:
                    await page.wait_for_selector('a.jobs-item-link', timeout=10000)
                except:
                    print(f"[!] No jobs found on page {page_num}, stopping")
                    break
                
                # Get all job cards
                job_cards = await page.query_selector_all('a.jobs-item-link')
                
                if not job_cards:
                    print(f"[!] No job cards found on page {page_num}")
                    break
                
                print(f"[*] Found {len(job_cards)} jobs on page {page_num}")
                
                for card in job_cards:
                    try:
                        # Extract job URL
                        href = await card.get_attribute('href')
                        job_url = f"https://jobs.stationf.co{href}" if href and not href.startswith('http') else href
                        
                        # Extract title from h4
                        title_el = await card.query_selector('h4')
                        title = await title_el.inner_text() if title_el else ""
                        
                        # Extract company from first li
                        company_el = await card.query_selector('ul li:first-child')
                        company = await company_el.inner_text() if company_el else ""
                        
                        # Extract contract type from second li (if exists)
                        contract_el = await card.query_selector('ul li:nth-child(2)')
                        contract = await contract_el.inner_text() if contract_el else ""
                        
                        # Try to extract location from URL or set default
                        location = "Paris, France"
                        if href:
                            # Location often in URL like: jobs/account-executive-2026_paris
                            parts = href.lower().split('_')
                            if len(parts) > 1:
                                loc = parts[-1].replace('-', ' ').title()
                                if loc and len(loc) > 2:
                                    location = loc
                        
                        if title.strip():
                            jobs.append({
                                "title": title.strip(),
                                "company": company.strip() if company else "Station F Startup",
                                "location": location,
                                "url": job_url or "",
                                "description": contract.strip() if contract else "",
                            })
                    except Exception as e:
                        print(f"[!] Error extracting job: {e}")
                        continue
                
                page_num += 1
            
            print(f"[*] Total scraped: {len(jobs)} jobs from Station F")
            
        except Exception as e:
            print(f"[!] Error during scraping: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()
    
    return jobs


async def main():
    """Test the scraper"""
    jobs = await scrape_stationf_jobs(max_pages=2, headless=False)
    print(f"\n=== Results: {len(jobs)} jobs ===")
    print(json.dumps(jobs[:5], indent=2, ensure_ascii=False))  # Show first 5
    return jobs


if __name__ == "__main__":
    asyncio.run(main())
