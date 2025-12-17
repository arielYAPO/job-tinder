'use client'
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Sparkles, FileText, ArrowRight, Clock, PartyPopper } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FirstLikeModal({ isOpen, onClose, jobTitle, jobCompany, onGenerateCV }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const router = useRouter();

    const handleGenerate = async () => {
        setIsGenerating(true);

        // Call parent's generate function
        if (onGenerateCV) {
            await onGenerateCV();
        }

        // Redirect to liked page with highlight
        router.push('/liked?highlight=true');
    };

    const handleLater = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="glass gradient-border rounded-3xl p-8 max-w-md w-full relative overflow-hidden"
                >
                    {/* Confetti effect */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    y: -20,
                                    x: Math.random() * 300 - 150,
                                    opacity: 1,
                                    rotate: 0
                                }}
                                animate={{
                                    y: 400,
                                    opacity: 0,
                                    rotate: Math.random() * 360
                                }}
                                transition={{
                                    duration: 2 + Math.random() * 2,
                                    delay: Math.random() * 0.5,
                                    ease: 'easeOut'
                                }}
                                className="absolute top-0 left-1/2"
                                style={{
                                    width: 8 + Math.random() * 8,
                                    height: 8 + Math.random() * 8,
                                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                    background: ['#00D9FF', '#FF00AA', '#10B981', '#F59E0B'][Math.floor(Math.random() * 4)]
                                }}
                            />
                        ))}
                    </div>

                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 via-transparent to-[var(--secondary)]/20 pointer-events-none" />

                    <div className="relative z-10 text-center">
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-2xl mb-6"
                        >
                            <PartyPopper className="w-10 h-10 text-white" />
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-white mb-2"
                        >
                            Super choix ! 🎉
                        </motion.h2>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-[var(--foreground-muted)] mb-6"
                        >
                            Tu as liké <span className="text-white font-medium">{jobTitle}</span> chez{' '}
                            <span className="text-[var(--primary)]">{jobCompany}</span>
                        </motion.p>

                        {/* CV Generation prompt */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-[var(--primary)]/20 rounded-xl">
                                    <FileText className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <p className="text-white font-medium text-left">
                                    Veux-tu un CV personnalisé par IA pour ce job ?
                                </p>
                            </div>
                            <p className="text-sm text-[var(--foreground-dim)] text-left">
                                On analyse l'offre et on adapte ton CV pour matcher les attentes du recruteur.
                            </p>
                        </motion.div>

                        {/* Where it goes note */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-xs text-[var(--foreground-dim)] mb-6 flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-3 h-3" />
                            Ton CV sera visible dans l'onglet <span className="text-white">Mes CV</span>
                        </motion.p>

                        {/* Buttons */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="space-y-3"
                        >
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-2xl hover:glow-primary transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Génération du CV...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Générer un CV personnalisé
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleLater}
                                disabled={isGenerating}
                                className="w-full py-3 text-[var(--foreground-dim)] text-sm hover:text-white transition flex items-center justify-center gap-2"
                            >
                                <Clock className="w-4 h-4" />
                                Plus tard — juste sauvegarder le job
                            </button>
                        </motion.div>

                        {isGenerating && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-[var(--foreground-dim)] mt-4"
                            >
                                Ça prend environ 10 secondes...
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
