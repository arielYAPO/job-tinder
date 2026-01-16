"use client";

import { motion } from 'framer-motion';
import { Building2, ExternalLink } from 'lucide-react';

export default function CompanyGridItem({ company, onClick }) {
    const initials = company.initials || company.company?.substring(0, 2).toUpperCase() || '?';
    const matchScore = company.matchScore || null;
    const sector = company.sector || null;
    const stack = company.stack || [];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            className="group cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-[var(--primary)]/30 transition-all flex flex-col h-full bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white/80">{initials}</span>
                </div>
                {matchScore !== null && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                        {matchScore}%
                    </span>
                )}
            </div>

            <h3 className="text-white font-bold text-lg mb-1 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                {company.company}
            </h3>

            {sector ? (
                <span className="text-xs text-[var(--foreground-muted)] mb-3 block">
                    {sector}
                </span>
            ) : (
                <span className="text-xs text-white/30 mb-3 block">Station F</span>
            )}

            <div className="mt-auto">
                <div className="flex flex-wrap gap-1 mb-3">
                    {stack.slice(0, 3).map((tech, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-black/30 border border-white/5 rounded text-[10px] text-white/50">
                            {tech}
                        </span>
                    ))}
                    {stack.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-white/30">+{stack.length - 3}</span>
                    )}
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--primary)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Voir détails</span>
                    <ExternalLink className="w-3 h-3" />
                </div>
            </div>
        </motion.div>
    );
}
