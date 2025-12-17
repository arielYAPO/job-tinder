'use client'
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import { Briefcase, GraduationCap, Rocket, ChevronLeft, ArrowRight } from 'lucide-react';

const goals = [
    {
        id: 'apprenticeship',
        icon: GraduationCap,
        title: 'Apprenticeship',
        titleFr: 'Alternance',
        description: 'Work + study program (1-3 years)',
        color: 'var(--primary)',
        bgColor: 'var(--primary)'
    },
    {
        id: 'internship',
        icon: Rocket,
        title: 'Internship',
        titleFr: 'Stage',
        description: 'Short-term experience (1-6 months)',
        color: 'var(--secondary)',
        bgColor: 'var(--secondary)'
    },
    {
        id: 'fulltime',
        icon: Briefcase,
        title: 'Full-time',
        titleFr: 'CDI / CDD',
        description: 'Permanent or fixed-term contract',
        color: '#10B981',
        bgColor: '#10B981'
    }
];

export default function StepGoal({ onNext, onBack }) {
    const { goalType, updateGoalType } = useOnboarding();

    const handleSelect = async (goalId) => {
        await updateGoalType(goalId);
    };

    const handleContinue = () => {
        if (goalType) {
            onNext();
        }
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
                        What are you looking for?
                    </h2>
                    <p className="text-[var(--foreground-muted)]">
                        This helps us tailor your experience
                    </p>
                </motion.div>

                {/* Goal cards */}
                <div className="space-y-3 mb-8">
                    {goals.map((goal, index) => {
                        const Icon = goal.icon;
                        const isSelected = goalType === goal.id;

                        return (
                            <motion.button
                                key={goal.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 + index * 0.1 }}
                                onClick={() => handleSelect(goal.id)}
                                className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${isSelected
                                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                    }`}
                            >
                                <div
                                    className="p-3 rounded-xl"
                                    style={{
                                        backgroundColor: `${goal.bgColor}20`
                                    }}
                                >
                                    <Icon
                                        className="w-6 h-6"
                                        style={{ color: goal.color }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">{goal.title}</span>
                                        <span className="text-xs text-[var(--foreground-dim)] bg-white/5 px-2 py-0.5 rounded-full">
                                            {goal.titleFr}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--foreground-muted)]">
                                        {goal.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </motion.div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={onBack}
                        className="px-6 py-4 bg-white/5 border border-white/10 text-[var(--foreground-muted)] font-medium rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                    </motion.button>
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: goalType ? 1.02 : 1 }}
                        whileTap={{ scale: goalType ? 0.98 : 1 }}
                        onClick={handleContinue}
                        disabled={!goalType}
                        className={`flex-1 py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${goalType
                                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:glow-primary'
                                : 'bg-white/10 text-[var(--foreground-dim)] cursor-not-allowed'
                            }`}
                    >
                        Continue
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
