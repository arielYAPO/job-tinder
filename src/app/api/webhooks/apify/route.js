import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
    // Create client inside function to avoid build-time errors
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (token !== process.env.APIFY_WEBHOOK_SECRET) {
        return new Response('Unauthorized Invalid webhook token', { status: 401 });

    }
    const payload = await request.json();
    const datasetId = payload?.resource?.defaultDatasetId;

    if (!datasetId) {

        return new Response('Unauthorized Invalid dataset ID', { status: 400 });

    }
    const apifyResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&format=json`,
        {
            headers: {
                'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
            }
        }
    );

    const items = await apifyResponse.json();
    const jobs = items.map(item => ({
        source: 'linkedin',
        source_job_id: item.id,
        external_id: item.id,
        title: item.title,
        company_name: item.companyName,
        location_city: item.location,
        description: item.descriptionHtml || item.description,
        skills: null,
        job_url: item.url,
        recruiter_name: item.recruiterName,
        recruiter_url: item.recruiterUrl,
        apply_link: item.applyUrl || item.url,
        posted_at: item.postedDate,
        salary: item.salary,
        contract_type: item.contractType,
        experience_level: item.experienceLevel,
        fetched_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('jobs')
        .upsert(jobs, {
            onConflict: 'source,source_job_id'
        });

    if (error) {
        console.error('Supabase error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
        success: true,
        jobsProcessed: jobs.length
    });


}