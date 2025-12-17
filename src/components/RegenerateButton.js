'use client'
import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegenerateButton({ userId, jobId }) {
    const [regenerating, setRegenerating] = useState(false);
    const router = useRouter();

    const handleRegenerate = async () => {
        if (regenerating) return;

        if (!confirm('Régénérer le CV ? Cela remplacera la version actuelle.')) {
            return;
        }

        setRegenerating(true);
        try {
            const res = await fetch('/api/regenerate-cv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, job_id: jobId })
            });

            const data = await res.json();

            if (data.success) {
                router.refresh();
            } else {
                alert('Erreur: ' + (data.error || 'Échec de la régénération'));
            }
        } catch (error) {
            console.error('Regenerate error:', error);
            alert('Erreur lors de la régénération');
        }
        setRegenerating(false);
    };

    return (
        <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="p-1.5 text-[var(--foreground-dim)] hover:text-[var(--primary)] transition rounded-lg hover:bg-white/5 disabled:opacity-50"
            title="Régénérer le CV"
        >
            {regenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <RefreshCw className="w-4 h-4" />
            )}
        </button>
    );
}
