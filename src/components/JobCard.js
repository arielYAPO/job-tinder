'use client'
import createClient from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { MapPin, Building2, X, Heart, Sparkles, Briefcase, Clock, GraduationCap, Laptop, Wand2, Code, Target, Users, Gift, Loader2, DollarSign, User, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function JobCard({ job, onSwipe }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [simplifying, setSimplifying] = useState(false);
    const [simplifiedData, setSimplifiedData] = useState(null);

    const displayJob = job;

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
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // ==========================================
            // STEP 1: Upsert job to database
            // ==========================================
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
                    fetched_at: new Date().toISOString()
                }, {
                    onConflict: 'source,source_job_id'
                })
                .select('id')
                .single();

            if (upsertError) {
                console.error('Upsert error:', upsertError);
                throw new Error(`Failed to store job: ${upsertError.message}`);
            }

            if (!storedJob) {
                throw new Error('Upsert returned no data');
            }

            console.log('Job stored:', storedJob);

            // ==========================================
            // STEP 2: Record swipe
            // ==========================================
            await supabase.from('swipes').insert({
                user_id: user.id,
                job_id: storedJob.id,
                source: displayJob.source,
                source_job_id: displayJob.source_job_id,
                action: 'like'
            });

            // ==========================================
            // STEP 3: Create application
            // ==========================================
            await supabase.from('applications').insert({
                user_id: user.id,
                job_id: storedJob.id,
                status: 'draft'
            });

            // ==========================================
            // STEP 4: Generate tailored CV
            // ==========================================
            await fetch('/api/generate-cv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    job_id: storedJob.id
                })
            });

        } catch (error) {
            console.error('❌ Like action failed:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            if (onSwipe) onSwipe('right');
        }
    };

    const handlePass = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('swipes').insert({
            user_id: user.id,
            job_id: null,
            source: displayJob.source,
            source_job_id: displayJob.source_job_id,
            action: 'pass'
        });

        if (onSwipe) onSwipe('left');
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

            <div className="relative flex-1 flex flex-col">
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
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mask-fade-bottom max-h-[300px]">
                    {/* Simplified View */}
                    {simplifiedData ? (
                        <div className="space-y-4">
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
                                className="text-sm text-[var(--foreground-dim)] hover:text-white"
                            >
                                ← Voir la description originale
                            </button>
                        </div>
                    ) : displayJob.description ? (
                        <>
                            <div
                                className="text-[var(--foreground-muted)] text-base leading-relaxed prose prose-invert prose-sm max-w-none
                                    [&>p]:mb-3 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4
                                    [&>strong]:text-white [&>b]:text-white"
                                dangerouslySetInnerHTML={{
                                    __html: expanded
                                        ? displayJob.description
                                        : displayJob.description.slice(0, 200) + (displayJob.description.length > 200 ? '...' : '')
                                }}
                            />
                            <div className="flex items-center gap-4 mt-3">
                                {displayJob.description.length > 200 && (
                                    <button
                                        onClick={() => setExpanded(!expanded)}
                                        className="text-[var(--primary)] text-sm font-medium hover:underline"
                                    >
                                        {expanded ? '▲ Show less' : '▼ Show more'}
                                    </button>
                                )}
                                <button
                                    onClick={handleSimplify}
                                    disabled={simplifying}
                                    className="flex items-center gap-1.5 text-sm font-medium text-[var(--secondary)] hover:text-white transition-colors disabled:opacity-50"
                                >
                                    {simplifying ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse...</>
                                    ) : (
                                        <><Wand2 className="w-3.5 h-3.5" /> Simplifier</>
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
                        {loading ? 'Generating...' : 'Apply & Tailor CV'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default JobCard;