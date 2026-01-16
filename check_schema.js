const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    const { data, error } = await supabase.from('jobs').select('*').limit(1);
    if (!error && data.length > 0) {
        console.log(`FULL KEYS:`, JSON.stringify(Object.keys(data[0])));
    } else {
        console.log("Error or empty:", error);
    }
}

inspectSchema();
