import createClient from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Building2, X, Heart, Sparkles, Briefcase, Clock, GraduationCap, Laptop, Wand2, Code, Target, Users, Gift, Loader2, DollarSign, User, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import he from 'he';

function JobCard({ job, onSwipe }) {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [simplifying, setSimplifying] = useState(false);
    const [simplifiedData, setSimplifiedData] = useState(null);

    const displayJob = job;

    // Normalize whitespace for preview (removes empty tags, multiple line breaks, extra spaces)
    const normalizeForPreview = (html = "") => {
        return html
            .replace(/<p>\s*<\/p>/gi, "")           // Remove empty <p> tags
            .replace(/<br\s*\/?>/gi, " ")           // Replace <br> with space
            .replace(/\s{2,}/g, " ")                // Multiple spaces → single space
            .replace(/\n{2,}/g, "\n")               // Multiple newlines → single
            .trim();
    };

    // Strip HTML tags and decode entities for plain text preview (SSR-safe)
    const stripHtml = (html = "") => {
        // First strip tags
        let text = html
            .replace(/<[^>]*>/g, " ")               // Remove all HTML tags
            .replace(/\s{2,}/g, " ")                // Multiple spaces → single space
            .trim();

        // Decode HTML entities using he library (works same on server and client)
        text = he.decode(text);

        return text;
    };

    // AI Simplify handler
    const handleSimplify = async () => {
        if (simplifiedData || simplifying) return;

        setSimplifying(true);
        try {
            const res = await fetch('/api/simplify-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: displayJob.source_job_id,
                    description: displayJob.description,
                    title: displayJob.title,
                    company: displayJob.company_name
                })
            });

            if (res.ok) {
                const { data } = await res.json();
                setSimplifiedData(data);
            }
        } catch (err) {
            console.error('Simplify failed:', err);
        } finally {
            setSimplifying(false);
        }
    };

    const handleLike = async () => {
        // ✅ INSTANT UI RESPONSE - Trigger swipe animation immediately
        if (onSwipe) onSwipe('right');
        setLoading(true);

        // 🔄 BACKGROUND PROCESSING - Don't block the UI
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // STEP 1: Upsert job to database
            console.log('Upserting job:', {
                source: displayJob.source,
                source_job_id: displayJob.source_job_id,
                title: displayJob.title
            });

            const { data: storedJob, error: upsertError } = await supabase
                .from('jobs')
                .upsert({
                    source: displayJob.source,
                    source_job_id: displayJob.source_job_id,
                    external_id: displayJob.source_job_id,
                    title: displayJob.title,
                    company_name: displayJob.company_name,
                    location_city: displayJob.location_city,
                    description: displayJob.description,
                    skills: displayJob.skills,
                    apply_url: displayJob.apply_url,
                    fetched_at: new Date().toISOString()
                }, {
                    onConflict: 'source,source_job_id'
                })
                .select('id')
                .single();

            if (upsertError) {
                console.error('Upsert error:', upsertError);
                return; // Silent fail - UI already moved on
            }

            if (!storedJob) {
                console.error('Upsert returned no data');
                return;
            }

            console.log('Job stored:', storedJob);

            // STEP 2: Record swipe
            await supabase.from('swipes').insert({
                user_id: user.id,
                job_id: storedJob.id,
                source: displayJob.source,
                source_job_id: displayJob.source_job_id,
                action: 'like'
            });

            // STEP 3: Create application
            await supabase.from('applications').insert({
                user_id: user.id,
                job_id: storedJob.id,
                status: 'draft'
            });

            // STEP 4: Generate tailored CV (fire and forget)
            fetch('/api/generate-cv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    job_id: storedJob.id
                })
            });

            // STEP 5: Update checklist flags
            await supabase.from('profiles').update({
                has_liked_job: true,
                has_generated_cv: true
            }).eq('user_id', user.id);
            console.log('✅ Checklist flags updated (has_liked_job, has_generated_cv)');

            // ❌ REMOVED: router.push('/liked') - Let user keep swiping!

        } catch (error) {
            console.error('❌ Like action failed:', error);
            // Silent fail - UI already moved on (Optimistic UI)
        } finally {
            setLoading(false);
        }
    };

    const handlePass = async () => {
        // ✅ INSTANT UI RESPONSE
        if (onSwipe) onSwipe('left');

        // 🔄 BACKGROUND PROCESSING
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('swipes').insert({
                user_id: user.id,
                job_id: null,
                source: displayJob.source,
                source_job_id: displayJob.source_job_id,
                action: 'pass'
            });
        } catch (error) {
            console.error('Pass swipe failed:', error);
            // Silent fail
        }
    };


    return (
        <div className="glass gradient-border rounded-3xl p-6 relative overflow-hidden h-full flex flex-col shadow-2xl shadow-black/50 cursor-grab active:cursor-grabbing">
            {/* Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-8 text-center"
                    >
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-[var(--secondary)] blur-xl opacity-20 rounded-full animate-pulse" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles className="w-16 h-16 text-[var(--secondary)]" />
                            </motion.div>
                        </div>

                        <motion.h3
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-2xl font-bold text-white mb-2"
                        >
                            Tailoring your CV...
                        </motion.h3>

                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-[var(--foreground-muted)] text-sm mb-8 max-w-[200px]"
                        >
                            Analyzing duties & matching your skills to {displayJob.company_name}
                        </motion.p>

                        <div className="w-full max-w-[240px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                                className="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary)] bg-[length:200%_100%] animate-shimmer"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subtle glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--secondary)]/5 pointer-events-none" />

            <div className="relative flex-1 min-h-0 flex flex-col">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2 leading-tight tracking-tight">{displayJob.title}</h2>

                    <div className="flex items-center gap-2 text-[var(--primary)] font-medium text-lg">
                        <Building2 className="w-5 h-5 opacity-80" />
                        <h3>{displayJob.company_name}</h3>
                    </div>
                </div>

                {/* Info Row - Location & Contract Details */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--foreground-dim)] mb-4">
                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <MapPin className="w-3.5 h-3.5" />
                        {displayJob.location_city || 'Location not specified'}
                    </div>
                    {displayJob.contract_type && (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-400">
                            {Array.isArray(displayJob.contract_type) ? displayJob.contract_type.join(', ') : displayJob.contract_type}
                        </div>
                    )}
                    {displayJob.contract_duration && (
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            <Clock className="w-3.5 h-3.5" />
                            {displayJob.contract_duration} mois
                        </div>
                    )}
                    {displayJob.remote_mode && (
                        <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 text-blue-400">
                            <Laptop className="w-3.5 h-3.5" />
                            {displayJob.remote_mode === 'remote' ? 'Remote' : displayJob.remote_mode === 'hybrid' ? 'Hybrid' : 'On-site'}
                        </div>
                    )}
                    {displayJob.target_diploma?.level && (
                        <div className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 text-purple-400">
                            <GraduationCap className="w-3.5 h-3.5" />
                            Bac+{displayJob.target_diploma.level}
                        </div>
                    )}
                    {displayJob.salary && (
                        <div className="flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 text-green-400">
                            <DollarSign className="w-3.5 h-3.5" />
                            {displayJob.salary}
                        </div>
                    )}
                    {displayJob.experience_level && (
                        <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 text-amber-400">
                            <Briefcase className="w-3.5 h-3.5" />
                            {displayJob.experience_level}
                        </div>
                    )}
                </div>

                {/* Description - Scrollable area with HTML rendering */}
                {/* Simplified View */}
                {simplifiedData ? (
                    <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Summary */}
                        <p className="text-white font-medium">{simplifiedData.summary}</p>

                        {/* Missions */}
                        {simplifiedData.missions?.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)] uppercase mb-2">
                                    <Target className="w-3.5 h-3.5" /> Missions
                                </div>
                                <ul className="space-y-1 text-sm text-[var(--foreground-muted)]">
                                    {simplifiedData.missions.map((m, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-[var(--primary)]">•</span> {m}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Tech Stack */}
                        {simplifiedData.tech_stack?.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase mb-2">
                                    <Code className="w-3.5 h-3.5" /> Tech Stack
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {simplifiedData.tech_stack.map((tech, i) => (
                                        <span key={i} className="px-2 py-1 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Requirements */}
                        {simplifiedData.requirements?.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase mb-2">
                                    <GraduationCap className="w-3.5 h-3.5" /> Prérequis
                                </div>
                                <ul className="space-y-1 text-sm text-[var(--foreground-muted)]">
                                    {simplifiedData.requirements.map((r, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-orange-400">•</span> {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Perks */}
                        {simplifiedData.perks?.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase mb-2">
                                    <Gift className="w-3.5 h-3.5" /> Avantages
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {simplifiedData.perks.map((p, i) => (
                                        <span key={i} className="px-2 py-1 text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-md">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Back to original button */}
                        <button
                            onClick={() => setSimplifiedData(null)}
                            className="mt-4 py-2 text-sm text-[var(--foreground-dim)] hover:text-white transition-colors"
                        >
                            ← Voir la description originale
                        </button>
                    </div>
                ) : displayJob.description ? (
                    <>
                        {expanded ? (
                            // Expanded: Full HTML with scroll
                            <div
                                key="expanded"
                                className="text-[var(--foreground-muted)] text-base leading-relaxed prose prose-invert prose-sm max-w-none
                                    [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4
                                    [&>strong]:text-white [&>b]:text-white
                                    max-h-[180px] overflow-y-auto pr-2 custom-scrollbar"
                                dangerouslySetInnerHTML={{ __html: displayJob.description }}
                            />
                        ) : (
                            // Collapsed: Plain text preview with line-clamp (no HTML glitches)
                            <p
                                key="collapsed"
                                className="text-[var(--foreground-muted)] text-base leading-relaxed
                                    max-h-[80px] overflow-hidden line-clamp-4"
                            >
                                {stripHtml(displayJob.description)}
                            </p>
                        )}

                        {/* Control Buttons Row */}
                        <div className="flex items-center gap-3 mt-4 pt-2 border-t border-white/5">
                            {displayJob.description.length > 250 && (
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="flex-1 py-2 text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/10 rounded-lg hover:bg-[var(--primary)]/20 transition-colors"
                                >
                                    {expanded ? '▲ Show less' : '▼ Show more'}
                                </button>
                            )}

                            <button
                                onClick={handleSimplify}
                                disabled={simplifying}
                                className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                {simplifying ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse...</>
                                ) : (
                                    <><Wand2 className="w-3.5 h-3.5 text-purple-400" /> Simplifier</>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="text-[var(--foreground-muted)] text-base">No description available</p>
                )}
            </div>

            {/* Skills badges */}
            {displayJob.skills?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-dim)] uppercase tracking-wider mb-3">
                        <Briefcase className="w-3.5 h-3.5" />
                        Required Skills
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {displayJob.skills.slice(0, 5).map((skill, index) => (
                            <span
                                key={index}
                                className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 rounded-lg text-[var(--foreground)] hover:bg-white/10 hover:border-[var(--primary)]/30 transition-colors cursor-default"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Recruiter Info - LinkedIn Jobs */}
            {displayJob.recruiter_name && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                            <User className="w-4 h-4" />
                            <span>Recruiter: <strong className="text-white">{displayJob.recruiter_name}</strong></span>
                        </div>
                        {displayJob.recruiter_url && (
                            <a
                                href={displayJob.recruiter_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/20 transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Contact on LinkedIn
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-4">
                <button
                    onClick={handlePass}
                    className="group relative flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 text-[var(--foreground-muted)] font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 active:scale-[0.95]"
                >
                    <div className="p-1 rounded-full bg-white/5 group-hover:bg-red-500/20 transition-colors">
                        <X className="w-5 h-5" />
                    </div>
                    Pass
                </button>

                <button
                    onClick={handleLike}
                    disabled={loading}
                    className="group relative flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold shadow-lg shadow-[var(--primary)]/20 hover:scale-105 hover:shadow-xl hover:shadow-[var(--primary)]/40 active:scale-[0.95] transition-all disabled:opacity-70"
                >
                    <div className="p-1 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                        <Heart className="w-5 h-5 fill-white" />
                    </div>
                    {loading ? 'Génération...' : 'Générer CV'}
                </button>
            </div>
        </div>

    )
}

export default JobCard;