export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('id');

    if (!jobId) {
        return Response.json({ error: 'Job ID required' }, { status: 400 });
    }

    const apiUrl = `https://labonnealternance.apprentissage.beta.gouv.fr/api/v1/jobs/${jobId}`;

    console.log('🔍 Fetching job details for:', jobId);

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`⚠️ API Error ${response.status} for ID ${jobId}:`, errorText);

            // If it's a 404 or 400, it might mean this ID type isn't supported by this endpoint.
            // Return a graceful fallback instead of 500, so the UI doesn't break.
            return Response.json({
                source: 'labonnealternance',
                source_job_id: jobId,
                description: 'Description non disponible (Source externe)',
                // Return minimal data to prevent UI errors
                title: 'Offre externe',
                company_name: 'Entreprise partenaire',
                location_city: '',
                skills: [],
                _error: `Upstream ${response.status}`
            });
        }

        const job = await response.json();

        console.log('✅ Job details received for:', jobId);


        // Transform to our format
        // Transform to our format
        // The API returns { matchas: [...], peJobs: [...] } or sometimes nested { job: { ... } }
        // We need to be robust. 
        // Based on logs: { job: { ... } } seems likely for details endpoint too

        const jobData = job.job || job; // Handle nesting if present

        return Response.json({
            source: 'labonnealternance',
            source_job_id: jobData.id || jobId,
            title: jobData.romeLabel || jobData.title || jobData.name || 'Alternance Position',
            company_name: jobData.company?.name || jobData.companyName || 'Company',
            location_city: jobData.place?.city || jobData.city || '',
            // Handle nested description
            description: jobData.jobDescription || jobData.description || 'No description available',

            // Handle nested skills
            skills: Array.isArray(jobData.romeDetails?.competencesDeBase)
                ? jobData.romeDetails.competencesDeBase.flatMap(cat =>
                    cat.items?.map(i => i.libelle) || []
                ).slice(0, 5)
                : [],

            _original: job
        });

    } catch (error) {
        console.error('💥 Job details fetch error:', error.message);
        return Response.json({
            error: error.message,
            hint: 'Check server logs for details'
        }, { status: 500 });
    }
}
