export async function GET(request) {
    const { searchParams } = new URL(request.url);

    // Get search params (with defaults for Paris)
    const lat = searchParams.get('lat') || '48.8566';
    const lon = searchParams.get('lon') || '2.3522';
    const radius = searchParams.get('radius') || '30';
    const romes = searchParams.get('romes') || 'M1805'; // IT/Dev by default

    try {
        const apiUrl =
            `https://labonnealternance.apprentissage.beta.gouv.fr/api/v1/jobs?` +
            `latitude=${lat}&longitude=${lon}&radius=${radius}&romes=${romes}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        // Transform to our format
        const jobs = (data.jobs || data.results || []).map(job => ({
            source: 'labonnealternance',
            source_job_id: job.id || job.offerId,
            title: job.title || job.intitule,
            company_name: job.company?.name || job.entreprise?.nom || 'Unknown',
            location_city: job.place?.city || job.lieu || '',
            description: job.description || job.descriptionOffre || '',
            skills: job.competences || [],

            // Keep original for reference
            _original: job
        }));

        return Response.json(jobs);

    } catch (error) {
        console.error('La Bonne Alternance API error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}