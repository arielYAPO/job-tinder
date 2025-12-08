// Helper: Extract city from French address format "15 RUE DES HALLES 75001 PARIS"
function extractCity(address) {
    if (!address) return '';
    // French postal code is 5 digits, city name follows it
    const match = address.match(/\d{5}\s+(.+)$/);
    if (match) return match[1].trim();
    // Fallback: return last word(s) after a number
    const parts = address.split(' ');
    return parts.slice(-1)[0] || address;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);

    // Get API token from environment
    const apiToken = process.env.LBA_API_TOKEN;
    if (!apiToken) {
        console.error('❌ LBA_API_TOKEN not configured');
        return Response.json({ error: 'LBA_API_TOKEN not configured' }, { status: 500 });
    }

    // NEW API uses longitude/latitude instead of insee
    // Default: Paris coordinates
    const longitude = searchParams.get('longitude') || '2.347';
    const latitude = searchParams.get('latitude') || '48.859';
    const radius = searchParams.get('radius') || '100'; // km
    const romes = searchParams.get('romes') || 'M1805,M1801,M1802,M1803,M1810';

    // NEW API endpoint (with /api prefix)
    const baseUrl = 'https://api.apprentissage.beta.gouv.fr/api';
    const apiUrl = `${baseUrl}/job/v1/search?` +
        `longitude=${longitude}&latitude=${latitude}&radius=${radius}&romes=${romes}`;

    console.log('🔍 Fetching from NEW API:', apiUrl);

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
            return Response.json({ error: 'API authentication failed' }, { status: 401 });
        }

        if (!response.ok) {
            console.error('❌ API Error:', response.status, responseText);
            return Response.json({ error: responseText }, { status: response.status });
        }

        const data = JSON.parse(responseText);

        console.log('✅ API Data received:', {
            jobs: data?.jobs?.length || 0,
            recruiters: data?.recruiters?.length || 0
        });

        // Transform jobs to our format (compatible with existing frontend)
        const jobs = (data.jobs || []).map((job, index) => {
            return {
                source: 'labonnealternance',
                source_job_id: job.identifier?.id || `lba-${index}`,
                partner: job.identifier?.partner_label || 'offres_emploi_lba',

                // Job details
                title: job.offer?.title || 'Alternance Position',
                description: job.offer?.description || null,
                status: job.offer?.status,

                // Company info
                company_name: job.workplace?.name || 'Company',
                company_siret: job.workplace?.siret,
                company_website: job.workplace?.website,

                // Location - API doesn't have city field, extract from address
                // Address format: "15 RUE DES HALLES 75001 PARIS"
                location_city: extractCity(job.workplace?.location?.address) || '',
                location_address: job.workplace?.location?.address,
                latitude: job.workplace?.location?.geopoint?.coordinates?.[1],
                longitude: job.workplace?.location?.geopoint?.coordinates?.[0],

                // Contract
                contract_type: job.contract?.type,
                contract_duration: job.contract?.duration,
                contract_start: job.contract?.start,
                remote_mode: job.contract?.remote,

                // Skills
                skills: job.offer?.desired_skills || [],
                skills_to_acquire: job.offer?.to_be_acquired_skills || [],

                // Application
                apply_url: job.apply?.url,
                apply_phone: job.apply?.phone,

                // Diploma
                target_diploma: job.offer?.target_diploma,
                rome_codes: job.offer?.rome_codes,

                // Keep original for debugging
                _original: job
            };
        });

        // Optionally include recruiters (spontaneous applications)
        // For now, we'll focus on actual job postings
        // const recruiters = (data.recruiters || []).map(...)

        console.log(`📦 Returning ${jobs.length} jobs to frontend`);

        return Response.json(jobs);

    } catch (error) {
        console.error('💥 La Bonne Alternance API error:', error.message);
        return Response.json({
            error: error.message,
            hint: 'Check if LBA_API_TOKEN is valid'
        }, { status: 500 });
    }
}
