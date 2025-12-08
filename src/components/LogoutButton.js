'use client'
import createClient from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

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
            className="px-4 py-2 bg-white/5 border border-white/10 text-[var(--foreground-muted)] rounded-xl hover:bg-white/10 transition text-sm flex items-center justify-center text-[var(--danger)]/80 hover:text-[var(--danger)]"
            title="Sign Out"
        >
            <LogOut className="w-5 h-5" />
        </button>
    );
}
export default LogoutButton;