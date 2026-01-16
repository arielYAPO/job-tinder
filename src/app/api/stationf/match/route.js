/**
 * Station F Match API Route
 * 
 * Calls Python backend to get AI-powered match scores for user profile
 */

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

export async function POST(request) {
    try {
        const body = await request.json();

        const response = await fetch(`${PYTHON_API_URL}/match`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Python API error: ${response.status}`);
        }

        const data = await response.json();

        return Response.json(data);

    } catch (error) {
        console.error('Error calling match API:', error);

        return Response.json({
            success: false,
            matches: [],
            message: `Failed to get matches: ${error.message}`,
        }, { status: 500 });
    }
}
