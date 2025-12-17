'use client'
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Heart, FileText, Download } from 'lucide-react';

export default function StepWelcome({ onNext }) {
    return (
        <div className="glass gradient-border rounded-3xl p-8 md:p-10 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10 pointer-events-none" />

            <div className="relative z-10 text-center">
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-2xl mb-6"
                >
                    <Sparkles className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl md:text-3xl font-bold text-white mb-3"
                >
                    Swipe jobs. Get a tailored CV<br />
                    <span className="text-neon">in 1 click.</span>
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-[var(--foreground-muted)] mb-8"
                >
                    The easiest way to apply to jobs in France.
                </motion.p>

                {/* Feature bullets */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid gap-3 mb-8 text-left"
                >
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                        <div className="p-2.5 bg-[var(--primary)]/20 rounded-xl">
                            <Heart className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Swipe jobs like Tinder</p>
                            <p className="text-xs text-[var(--foreground-dim)]">Left to pass, right to save</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                        <div className="p-2.5 bg-[var(--secondary)]/20 rounded-xl">
                            <FileText className="w-5 h-5 text-[var(--secondary)]" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Like → AI generates CV + cover letter</p>
                            <p className="text-xs text-[var(--foreground-dim)]">Tailored to each job description</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                        <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                            <Download className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Download & apply</p>
                            <p className="text-xs text-[var(--foreground-dim)]">ATS-friendly format, ready to send</p>
                        </div>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNext}
                    className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-2xl hover:glow-primary transition-all flex items-center justify-center gap-2"
                >
                    Start
                    <ArrowRight className="w-5 h-5" />
                </motion.button>

                {/* Reassurance */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-xs text-[var(--foreground-dim)] mt-4"
                >
                    ✨ No stress — AI cleans and rewrites your inputs.
                </motion.p>
            </div>
        </div>
    );
}
