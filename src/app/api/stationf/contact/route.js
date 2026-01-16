/**
 * LinkedIn Contact Finder API Route
 * 
 * Finds LinkedIn contact (CEO/HR) for a given company.
 */

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

export async function POST(request) {
    try {
        const { company_name } = await request.json();

        if (!company_name) {
            return Response.json({
                success: false,
                message: 'company_name is required'
            }, { status: 400 });
        }

        const response = await fetch(`${PYTHON_API_URL}/find-contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ company_name }),
        });

        if (!response.ok) {
            throw new Error(`Python API error: ${response.status}`);
        }

        const data = await response.json();

        return Response.json(data);

    } catch (error) {
        console.error('Error finding LinkedIn contact:', error);

        return Response.json({
            success: false,
            company: '',
            contact: { name: null, title: null, linkedin_url: null },
            message: `Failed to find contact: ${error.message}`
        }, { status: 500 });
    }
}
