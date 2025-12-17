'use client'
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { CheckCircle2, Circle, User, Heart, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingChecklist({
    profileComplete = false,
    hasLikedJob = false,
    hasGeneratedCV = false,
    hasDownloadedCV = false,
    showMinimized = false
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const items = [
        {
            id: 'profile',
            label: 'Complete profile (80%+)',
            done: profileComplete,
            icon: User,
            href: '/profile'
        },
        {
            id: 'like',
            label: 'Like 1 job',
            done: hasLikedJob,
            icon: Heart,
            href: '/jobs'
        },
        {
            id: 'cv',
            label: 'Generate 1 CV',
            done: hasGeneratedCV,
            icon: FileText,
            href: '/liked'
        },
        {
            id: 'download',
            label: 'Download and apply',
            done: hasDownloadedCV,
            icon: Download,
            href: '/liked'
        },
    ];

    const completedCount = items.filter(i => i.done).length;
    const allComplete = completedCount === items.length;

    // Don't show if all complete
    if (allComplete) return null;

    if (showMinimized) {
        return (
            <Link href="/jobs" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs hover:bg-white/10 transition">
                <div className="flex -space-x-1">
                    {items.map((item, i) => (
                        <div
                            key={item.id}
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500' : 'bg-white/10'
                                }`}
                        >
                            {item.done ? (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                            ) : (
                                <Circle className="w-2 h-2 text-[var(--foreground-dim)]" />
                            )}
                        </div>
                    ))}
                </div>
                <span className="text-[var(--foreground-muted)]">
                    {completedCount}/{items.length} tasks
                </span>
            </Link>
        );
    }

    return (
        <motion.div
            layout
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4"
        >
            {/* Header - Always visible - Click to toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4"
            >
                <div className="flex flex-col items-start gap-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        🚀 Getting Started
                        <span className="text-xs font-normal text-[var(--foreground-dim)] ml-2">
                            {completedCount}/{items.length} completed
                        </span>
                    </h3>
                    {/* Mini Progress Bar when collapsed */}
                    {!isExpanded && (
                        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(completedCount / items.length) * 100}%` }}
                                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full"
                            />
                        </div>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[var(--foreground-dim)]" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--foreground-dim)]" />
                )}
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                    >
                        {/* Progress bar */}
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(completedCount / items.length) * 100}%` }}
                                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full"
                            />
                        </div>

                        {/* Checklist items */}
                        <div className="space-y-2">
                            {items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={`flex items-center gap-3 p-2 rounded-xl transition ${item.done
                                            ? 'opacity-60'
                                            : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done
                                            ? 'bg-emerald-500'
                                            : 'border border-white/20'
                                            }`}>
                                            {item.done ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                            ) : (
                                                <Icon className="w-3 h-3 text-[var(--foreground-dim)]" />
                                            )}
                                        </div>
                                        <span className={`text-sm ${item.done
                                            ? 'text-[var(--foreground-dim)] line-through'
                                            : 'text-[var(--foreground-muted)]'
                                            }`}>
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
