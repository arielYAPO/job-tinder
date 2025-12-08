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
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch (error) {
                    // The `setAll` method is called from Server Component.
                    // This can be ignored if you have middleware refreshing sessions.
                }
            }
        }
    });
}

export default createClient;
