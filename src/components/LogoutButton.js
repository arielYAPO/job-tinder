'use client'
import createClient from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function LogoutButton() {
    const supabase = createClient();
    const router = useRouter();

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/login');
    }

    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
        >
            Logout
        </button>
    );
}
export default LogoutButton;