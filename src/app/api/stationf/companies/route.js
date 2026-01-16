/**
 * Station F Companies API Route
 * 
 * Fetches companies (grouped jobs) from Supabase DB
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
    try {
        // Check for enrichedOnly query param
        const { searchParams } = new URL(request.url);
        const enrichedOnly = searchParams.get('enrichedOnly') === 'true';

        // Build query
        let query = supabase
            .from('jobs')
            .select('*')
            .eq('source', 'stationf');

        // Filter to only jobs with descriptions if requested
        if (enrichedOnly) {
            query = query.not('job_description', 'is', null);
        }

        const { data: jobs, error } = await query;

        if (error) throw error;

        // Group jobs by company
        const companiesDict = {};

        jobs.forEach(job => {
            const companyName = job.company_name || 'Inconnu';

            if (!companiesDict[companyName]) {
                companiesDict[companyName] = {
                    company: companyName,
                    description: job.description,
                    sector: job.sector,
                    stack: job.stack || [],
                    pitch: job.pitch,
                    initials: companyName.substring(0, 2).toUpperCase(),
                    positions: [],
                    job_count: 0
                };
            }

            companiesDict[companyName].positions.push({
                title: job.title,
                contract: job.contract_type,
                url: job.apply_url
            });
            companiesDict[companyName].job_count++;
        });

        const companies = Object.values(companiesDict);

        return Response.json({
            success: true,
            companies: companies,
            total_companies: companies.length,
            total_jobs: jobs.length,
            message: `Loaded ${companies.length} companies from Supabase`
        });

    } catch (error) {
        console.error('Error fetching companies from DB:', error);

        return Response.json({
            success: false,
            companies: [],
            total_companies: 0,
            total_jobs: 0,
            message: `Database error: ${error.message}`,
        }, { status: 500 });
    }
}
