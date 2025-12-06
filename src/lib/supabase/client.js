import { createBrowserClient } from "@supabase/ssr";

function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return createBrowserClient(url, key);
}

export default createClient;