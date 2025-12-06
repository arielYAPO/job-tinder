import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";


async function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const cookieStore = await cookies();
    return createServerClient(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(cookie => {
                    cookieStore.set(cookie);
                });
            }
        }
    });

}

export default createClient;
