"use client";

import { useState } from 'react';
import { ExternalLink, X, Heart, ChevronRight, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Company Card - VP Ready V3
 * With dynamic sector, pitch, stack from API enrichment
 */
export default function CompanyCard({ company, onSwipe }) {
    const [showAllPositions, setShowAllPositions] = useState(false);

    // Get match data if AI matching was run
    const matchScore = company.matchScore || null;
    const hasAIMatch = company.hasAIMatch || false;
    const matchReasons = company.matchReasons || [];

    // Get enrichment data from API
    const sector = company.sector || null;
    const pitch = company.pitch || null;
    const stack = company.stack || [];
    const initials = company.initials || company.company?.substring(0, 2).toUpperCase() || '?';

    // Filter to ONLY alternance/stage/apprentissage positions
    const alternanceKeywords = ['altern', 'apprenti', 'stage', 'intern', 'working student'];
    const alternancePositions = (company.positions || []).filter(p => {
        const contract = (p.contract || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        return alternanceKeywords.some(keyword =>
            contract.includes(keyword) || title.includes(keyword)
        );
    });

    // Dedupe alternance positions (max 3)
    const uniquePositions = [];
    const seenTitles = new Set();
    for (const pos of alternancePositions) {
        const title = pos.title?.toLowerCase().trim();
        if (!seenTitles.has(title) && uniquePositions.length < 3) {
            seenTitles.add(title);
            uniquePositions.push(pos);
        }
    }

    const alternanceCount = alternancePositions.length;
    const totalPositions = company.positions?.length || 0;

    const handleLike = () => onSwipe?.('right');
    const handlePass = () => onSwipe?.('left');

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass gradient-border rounded-3xl p-6 relative overflow-hidden h-full flex flex-col shadow-2xl shadow-black/80"
        >
            {/* Subtle glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10 pointer-events-none" />

            {/* Animated background shapes */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[var(--secondary)]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex-1 flex flex-col z-10">

                {/* ========== 1. HEADER: Avatar + Company + Pitch ========== */}
                <div className="mb-5">
                    <div className="flex items-start gap-4 mb-3">
                        {/* Company Avatar */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl font-bold text-white/80">{initials}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <h1 className="text-2xl font-extrabold text-white leading-tight tracking-tight">
                                    {company.company}
                                </h1>
                                {matchScore !== null && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                        className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] ml-2 flex-shrink-0"
                                    >
                                        <span className="text-emerald-400 font-bold text-xs">🔥 {matchScore}%</span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Pitch line (dynamic from API) */}
                            {pitch ? (
                                <p className="text-sm text-white/60 mt-1">{pitch}</p>
                            ) : (
                                <p className="text-sm text-white/40 mt-1">Startup • Station F</p>
                            )}
                        </div>
                    </div>

                    {/* Badges: 2 lignes */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-400 text-xs font-bold rounded border border-orange-500/30 flex items-center gap-1">
                                🚀 Station F
                            </span>
                            {sector && (
                                <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium rounded border border-[var(--primary)]/20">
                                    📈 {sector}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            <span>📍 Paris</span>
                            <span>•</span>
                            <span>🏠 Hybride</span>
                        </div>
                    </div>
                </div>

                {/* ========== MATCH REASONS (New) ========== */}
                {matchReasons.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 flex flex-wrap gap-2"
                    >
                        {matchReasons.map((reason, i) => (
                            <span key={i} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
                                ✨ {reason}
                            </span>
                        ))}
                    </motion.div>
                )}

                {/* ========== 2. RECRUITMENT SIGNAL ========== */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 mb-5 p-3 bg-gradient-to-r from-emerald-500/10 to-transparent border-l-4 border-emerald-500/50 rounded-r-xl"
                >
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-300 font-bold text-xs uppercase tracking-wide">Recrute</span>
                    </div>
                    <span className="text-white/20">|</span>
                    <span className="text-white/80 text-sm">
                        {alternanceCount > 0
                            ? `${alternanceCount} alternance${alternanceCount > 1 ? 's' : ''}`
                            : `${totalPositions} poste${totalPositions > 1 ? 's' : ''} (CDI)`
                        }
                    </span>
                </motion.div>

                {/* ========== 3. STACK (if available) ========== */}
                {stack.length > 0 && (
                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="mb-5"
                    >
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">Stack</p>
                        <div className="flex flex-wrap gap-1.5">
                            {stack.slice(0, 4).map((tech, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 bg-white/5 text-white/70 text-xs font-medium rounded border border-white/10"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ========== 4. ALTERNANCES DISPONIBLES ========== */}
                <div className="flex-1 min-h-0">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">
                        {alternanceCount > 0 ? 'Alternances' : 'Offres'}
                    </p>

                    {uniquePositions.length > 0 ? (
                        <div className="space-y-2 overflow-y-auto max-h-[180px] custom-scrollbar pr-1">
                            {uniquePositions.map((position, i) => (
                                <motion.a
                                    key={i}
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 + (i * 0.08) }}
                                    href={position.url?.startsWith('http') ? position.url : `https://jobs.stationf.co${position.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-[var(--primary)]/30 transition-all group"
                                >
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="text-white font-medium text-sm truncate group-hover:text-[var(--primary)] transition-colors">
                                            {position.title}
                                        </p>
                                        <p className="text-[10px] text-white/40 mt-0.5">
                                            {position.contract || 'Alternance'} • Paris
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[var(--primary)] flex-shrink-0" />
                                </motion.a>
                            ))}

                            {alternanceCount > 3 && (
                                <button className="w-full py-1.5 text-xs text-[var(--primary)]/70 hover:text-[var(--primary)] flex items-center justify-center gap-1">
                                    Voir les {alternanceCount} offres
                                    <ExternalLink className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center p-5 bg-white/5 border border-dashed border-white/10 rounded-xl text-center"
                        >
                            <span className="text-xl mb-1 opacity-40">🌵</span>
                            <p className="text-white/50 text-sm">Pas d'alternance</p>
                            <p className="text-white/30 text-xs mt-0.5">{totalPositions} postes CDI</p>
                        </motion.div>
                    )}
                </div>

            </div>

            {/* ========== 5. FOOTER: CTA ========== */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/10">
                <button
                    onClick={handlePass}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
                >
                    <X className="w-5 h-5" />
                    Passer
                </button>

                <button
                    onClick={handleLike}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold text-sm shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Heart className="w-5 h-5 fill-current" />
                    Intéressé
                </button>
            </div>
        </motion.div>
    );
}
