
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectJobs() {
    const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company_name, source, external_id')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching jobs:', error);
    } else {
        console.log('Latest 20 jobs:', JSON.stringify(data, null, 2));
    }
}

inspectJobs();
