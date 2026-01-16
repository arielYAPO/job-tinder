// Next.js API route to proxy alternance suggestions to Python backend
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

export async function POST(request) {
    try {
        const body = await request.json();

        const response = await fetch(`${PYTHON_API_URL}/suggest-alternances`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return Response.json(data);

    } catch (error) {
        console.error('Suggest alternances API error:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
