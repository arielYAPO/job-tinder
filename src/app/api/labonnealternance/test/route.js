export async function GET(request) {
    const { searchParams } = new URL(request.url);

    // Get API token from environment
    const apiToken = process.env.LBA_API_TOKEN;
    if (!apiToken) {
        return Response.json({ error: 'LBA_API_TOKEN not configured in .env.local' }, { status: 500 });
    }

    // NEW API uses longitude/latitude instead of insee
    // Default: Paris coordinates
    const longitude = searchParams.get('longitude') || '2.347';
    const latitude = searchParams.get('latitude') || '48.859';
    const radius = searchParams.get('radius') || '100';
    const romes = searchParams.get('romes') || 'M1805,M1801,M1802,M1803,M1810';

    // Try different API base URLs - the documentation base URL seems to return HTML
    // Options to try:
    // 1. api.apprentissage.beta.gouv.fr (returns HTML - website)
    // 2. labonnealternance-api.apprentissage.beta.gouv.fr
    // 3. api.labonnealternance.apprentissage.beta.gouv.fr

    const baseUrl = 'https://api.apprentissage.beta.gouv.fr/api';  // Try with /api prefix
    const apiUrl = `${baseUrl}/job/v1/search?` +
        `longitude=${longitude}&latitude=${latitude}&radius=${radius}&romes=${romes}`;

    console.log('🧪 TEST NEW API:', apiUrl);
    console.log('🔑 Token preview:', apiToken.substring(0, 30) + '...');

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Accept': 'application/json'
            }
        });

        const responseText = await response.text();

        // Check if response is HTML (error page)
        if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
            console.error('❌ Got HTML instead of JSON');
            return Response.json({
                error: 'API returned HTML instead of JSON',
                status: response.status,
                hint: 'Check if: 1) API URL is correct, 2) Token is valid, 3) Dev server was restarted',
                preview: responseText.substring(0, 300)
            }, { status: 500 });
        }

        if (!response.ok) {
            console.error('❌ API Error:', response.status, responseText);
            return Response.json({
                error: `API returned ${response.status}`,
                details: responseText
            }, { status: response.status });
        }

        const data = JSON.parse(responseText);

        // NEW API returns { jobs: [...], recruiters: [...], warnings: [...] }
        const samples = {
            summary: {
                jobs: data?.jobs?.length || 0,
                recruiters: data?.recruiters?.length || 0,
                warnings: data?.warnings || []
            },
            samples: {}
        };

        // Get first job sample with full details
        if (data.jobs?.[0]) {
            const job = data.jobs[0];
            samples.samples.firstJob = {
                id: job.identifier?.id,
                partner: job.identifier?.partner_label,
                title: job.offer?.title,
                company: job.workplace?.name,
                // Debug all location fields
                location_raw: job.workplace?.location,
                location_city: job.workplace?.location?.city,
                location_address: job.workplace?.location?.address,
                location_label: job.workplace?.location?.label,
                hasDescription: !!job.offer?.description,
                description: job.offer?.description
                    ? job.offer.description.substring(0, 300) + '...'
                    : '❌ NO DESCRIPTION',
                contractType: job.contract?.type,
                status: job.offer?.status,
                _note: 'Check location_raw to see all available location fields'
            };
        }

        // Get first recruiter sample
        if (data.recruiters?.[0]) {
            const recruiter = data.recruiters[0];
            samples.samples.firstRecruiter = {
                id: recruiter.identifier?.id,
                company: recruiter.workplace?.name,
                location: recruiter.workplace?.location?.city,
                _note: 'Recruiters are companies for spontaneous applications'
            };
        }

        return Response.json(samples);

    } catch (error) {
        console.error('💥 Test API error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
