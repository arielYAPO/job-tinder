/**
 * Station F Scraper API Route
 * 
 * Fetches scraped jobs from the Python backend API
 * and returns them for the frontend to display.
 */

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

export async function GET() {
    try {
        const response = await fetch(`${PYTHON_API_URL}/scrape/stationf`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Don't cache - we want fresh data
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Python API error: ${response.status}`);
        }

        const data = await response.json();

        return Response.json({
            success: data.success,
            jobs: data.jobs,
            message: data.message,
            source: 'stationf'
        });

    } catch (error) {
        console.error('Error fetching from Python API:', error);

        // Return error response
        return Response.json({
            success: false,
            jobs: [],
            message: `Failed to connect to scraper: ${error.message}`,
            source: 'stationf'
        }, { status: 500 });
    }
}
