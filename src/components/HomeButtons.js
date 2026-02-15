'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function HomeButtons() {
    const router = useRouter();
    const [loading, setLoading] = useState(null); // 'get-started' or 'login'

    const handleNavigation = (path, id) => {
        setLoading(id);
        router.push(path);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <button
                onClick={() => handleNavigation('/signup', 'get-started')}
                disabled={loading && loading !== 'get-started'}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-2xl text-center hover:scale-105 transition-transform shadow-lg shadow-[var(--primary)]/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
                {loading === 'get-started' ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Chargement...</span>
                    </>
                ) : (
                    <>
                        C'est parti <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>
            <button
                onClick={() => handleNavigation('/login', 'login')}
                disabled={loading && loading !== 'login'}
                className="flex-1 py-4 px-6 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl text-center hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading === 'login' ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Chargement...</span>
                    </>
                ) : (
                    "Connexion"
                )}
            </button>
        </div>
    );
}
