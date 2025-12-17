'use client'
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { MapPin, Briefcase, Calendar, Wifi, ChevronLeft, ArrowRight } from 'lucide-react';

const jobFamilies = [
    'Tech / Development',
    'Data / Analytics',
    'Cybersecurity',
    'Product / Design',
    'Marketing / Communication',
    'Sales / Business',
    'Finance / Accounting',
    'HR / Admin',
    'Other'
];

export default function StepPreferences({ onNext, onBack }) {
    const { preferences, updatePreferences } = useOnboarding();

    const [city, setCity] = useState(preferences.city || '');
    const [jobFamily, setJobFamily] = useState(preferences.job_family || '');
    const [startDate, setStartDate] = useState(preferences.start_date || '');
    const [remotePreference, setRemotePreference] = useState(preferences.remote_preference || 'any');

    const handleContinue = async () => {
        await updatePreferences({
            city,
            job_family: jobFamily,
            start_date: startDate,
            remote_preference: remotePreference
        });
        onNext();
    };

    const handleSkip = async () => {
        // Skip without saving preferences
        onNext();
    };

    return (
        <div className="glass gradient-border rounded-3xl p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10 pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Job preferences
                    </h2>
                    <p className="text-[var(--foreground-muted)]">
                        Help us show you relevant jobs from the start
                    </p>
                </motion.div>

                {/* Form fields */}
                <div className="space-y-5 mb-8">
                    {/* City */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 ml-1">
                            City / Location
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-dim)]" />
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Paris, Lyon, Bordeaux..."
                                className="w-full pl-12 pr-4 py-4 bg-[var(--surface-elevated)] border border-white/5 rounded-2xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                            />
                        </div>
                    </motion.div>

                    {/* Job Family */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 ml-1">
                            Job Family
                        </label>
                        <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-dim)]" />
                            <select
                                value={jobFamily}
                                onChange={(e) => setJobFamily(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[var(--surface-elevated)] border border-white/5 rounded-2xl text-white appearance-none cursor-pointer focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                            >
                                <option value="" className="bg-[var(--background)]">Select a field...</option>
                                {jobFamilies.map(family => (
                                    <option key={family} value={family} className="bg-[var(--background)]">
                                        {family}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-5 h-5 text-[var(--foreground-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </motion.div>

                    {/* Start Date */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 ml-1">
                            Desired Start Date <span className="text-[var(--foreground-dim)]">(optional)</span>
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-dim)]" />
                            <input
                                type="month"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[var(--surface-elevated)] border border-white/5 rounded-2xl text-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                            />
                        </div>
                    </motion.div>

                    {/* Remote Preference */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-3 ml-1">
                            Remote Preference
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { id: 'any', label: 'Any' },
                                { id: 'remote', label: 'Remote' },
                                { id: 'hybrid', label: 'Hybrid' },
                                { id: 'onsite', label: 'On-site' }
                            ].map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setRemotePreference(option.id)}
                                    className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${remotePreference === option.id
                                            ? 'bg-[var(--primary)] text-black'
                                            : 'bg-white/5 border border-white/10 text-[var(--foreground-muted)] hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {option.id === 'remote' && <Wifi className="w-4 h-4 inline mr-1.5" />}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Buttons */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-3"
                >
                    <button
                        onClick={onBack}
                        className="px-6 py-4 bg-white/5 border border-white/10 text-[var(--foreground-muted)] font-medium rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                    </button>
                    <button
                        onClick={handleContinue}
                        className="flex-1 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-2xl hover:glow-primary transition-all flex items-center justify-center gap-2"
                    >
                        Continue
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>

                {/* Skip option */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={handleSkip}
                    className="w-full mt-3 py-3 text-[var(--foreground-dim)] text-sm hover:text-white transition"
                >
                    Skip for now — you can filter later
                </motion.button>
            </div>
        </div>
    );
}
