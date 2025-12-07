'use client'
import createClient from "@/lib/supabase/client";
import { useState } from "react";

function JobCard({ job, onSwipe }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleLike = async () => {
        setLoading(true);  // Start loading

        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('swipes').insert({
            user_id: user.id,
            job_id: job.id,
            action: 'like'
        })

        // Generate CV
        await fetch('/api/generate-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                job_id: job.id
            })
        });

        await supabase.from('applications').insert({
            user_id: user.id,
            job_id: job.id,
            status: 'draft'
        })

        setLoading(false);  // Stop loading
        if (onSwipe) onSwipe();
    };

    const handlePass = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('swipes').insert({
            user_id: user.id,
            job_id: job.id,
            action: 'pass'
        });

        if (onSwipe) onSwipe();
    };

    return (
        <div className="glass gradient-border rounded-2xl p-6 relative overflow-hidden">
            {/* Subtle glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5 pointer-events-none" />

            <div className="relative">
                {/* Job Title */}
                <h2 className="text-2xl font-bold text-white mb-1">{job.title}</h2>

                {/* Company */}
                <h3 className="text-lg text-[var(--primary)] font-medium">{job.company_name}</h3>

                {/* Description */}
                <p className="text-[var(--foreground-muted)] mt-4 leading-relaxed">{job.description}</p>

                {/* Location */}
                <p className="text-[var(--foreground-dim)] mt-3 text-sm flex items-center gap-1">
                    📍 {job.location_city || job.location}
                </p>

                {/* Skills badges */}
                {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {job.skills.slice(0, 4).map((skill, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 text-xs font-medium tracking-wide bg-white/5 border border-white/10 rounded-full text-[var(--foreground-muted)]"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={handlePass}
                        className="flex-1 py-4 bg-white/5 border border-white/10 text-[var(--foreground-muted)] rounded-xl hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98] font-semibold"
                    >
                        ❌ Pass
                    </button>
                    <button
                        onClick={handleLike}
                        disabled={loading}
                        className="flex-1 py-4 bg-[var(--secondary)] text-white rounded-xl hover:glow-secondary transition-all active:scale-[0.98] font-semibold"
                    >
                        ❤️ Like
                    </button>
                </div>
            </div>
        </div>
    )
}

export default JobCard;