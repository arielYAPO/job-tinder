"use client";

import { useState, useEffect } from 'react';
import { Building2, MapPin, Briefcase, Linkedin, Loader2, ExternalLink, Sparkles, X, Heart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Station F Company Card
 * Displays scraped job with company info and LinkedIn contact
 */
export default function StationFCard({ job, onSwipe, onFindContact }) {
    const [contact, setContact] = useState(null);
    const [findingContact, setFindingContact] = useState(false);
    const [error, setError] = useState(null);

    // Find LinkedIn contact for this company
    const handleFindContact = async () => {
        if (findingContact || contact) return;

        setFindingContact(true);
        setError(null);

        try {
            const res = await fetch('/api/stationf/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_name: job.company })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.contact?.linkedin_url) {
                    setContact(data.contact);
                } else {
                    setError('Contact not found');
                }
            } else {
                setError('Failed to find contact');
            }
        } catch (err) {
            console.error('Error finding contact:', err);
            setError('Network error');
        } finally {
            setFindingContact(false);
        }
    };

    const handleLike = () => {
        if (onSwipe) onSwipe('right');
    };

    const handlePass = () => {
        if (onSwipe) onSwipe('left');
    };

    // Build full job URL
    const jobUrl = job.url?.startsWith('/')
        ? `https://jobs.stationf.co${job.url}`
        : job.url;

    return (
        <div className="glass gradient-border rounded-3xl p-6 relative overflow-hidden h-full flex flex-col shadow-2xl shadow-black/50">
            {/* Subtle glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--secondary)]/5 pointer-events-none" />

            <div className="relative flex-1 min-h-0 flex flex-col">
                {/* Station F Badge */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full">
                        Station F
                    </span>
                </div>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2 leading-tight tracking-tight">
                        {job.title}
                    </h2>

                    <div className="flex items-center gap-2 text-[var(--primary)] font-medium text-lg">
                        <Building2 className="w-5 h-5 opacity-80" />
                        <h3>{job.company}</h3>
                    </div>
                </div>

                {/* Contract Type */}
                {job.contract && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--foreground-dim)] mb-4">
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-400">
                            <Briefcase className="w-3.5 h-3.5" />
                            {job.contract}
                        </div>
                    </div>
                )}

                {/* LinkedIn Contact Section */}
                <div className="mt-auto pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-dim)] uppercase tracking-wider mb-3">
                        <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                        Direct Contact
                    </div>

                    <AnimatePresence mode="wait">
                        {contact ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">{contact.name}</p>
                                        <p className="text-sm text-blue-400">{contact.title}</p>
                                    </div>
                                    <a
                                        href={contact.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        <Linkedin className="w-4 h-4" />
                                        Connect
                                    </a>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleFindContact}
                                disabled={findingContact}
                                className="w-full py-3 flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                {findingContact ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Finding CEO/HR on LinkedIn...
                                    </>
                                ) : error ? (
                                    <>
                                        <span className="text-red-400">{error}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-yellow-400" />
                                        Find LinkedIn Contact (CEO/HR)
                                    </>
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* View Job Link */}
                {jobUrl && (
                    <a
                        href={jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 py-3 text-sm text-[var(--foreground-muted)] hover:text-white transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View full job on Station F
                    </a>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4">
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
                    className="group relative flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold shadow-lg shadow-[var(--primary)]/20 hover:scale-105 hover:shadow-xl hover:shadow-[var(--primary)]/40 active:scale-[0.95] transition-all"
                >
                    <div className="p-1 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                        <Heart className="w-5 h-5 fill-white" />
                    </div>
                    Interested
                </button>
            </div>
        </div>
    );
}
