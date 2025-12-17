'use client'
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import StepWelcome from './StepWelcome';
import StepGoal from './StepGoal';
import StepPreferences from './StepPreferences';
import StepProfile from './StepProfile';
import StepSwipeTutorial from './StepSwipeTutorial';

const slideVariants = {
    enter: (direction) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0
    })
};

export default function GuidedOnboarding({ profile, experiences, education, projects }) {
    const { step, nextStep, prevStep, completeOnboarding } = useOnboarding();
    const [direction, setDirection] = useState(0);

    const handleNext = async () => {
        setDirection(1);
        if (step === 4) {
            await completeOnboarding();
        } else {
            await nextStep();
        }
    };

    const handleBack = async () => {
        setDirection(-1);
        await prevStep();
    };

    const steps = [
        { id: 0, component: StepWelcome },
        { id: 1, component: StepGoal },
        { id: 2, component: StepPreferences },
        { id: 3, component: StepProfile },
        { id: 4, component: StepSwipeTutorial },
    ];

    const CurrentStepComponent = steps[step]?.component || StepWelcome;

    return (
        <div className="min-h-screen bg-haze flex flex-col">
            {/* Progress Indicator */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[var(--foreground-dim)]">
                            Step {step + 1} of 5
                        </span>
                        <span className="text-xs font-bold text-[var(--primary)]">
                            {Math.round(((step + 1) / 5) * 100)}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((step + 1) / 5) * 100}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full"
                        />
                    </div>
                    {/* Step dots */}
                    <div className="flex justify-center gap-2 mt-3">
                        {steps.map((s, i) => (
                            <div
                                key={s.id}
                                className={`w-2 h-2 rounded-full transition-all ${i === step
                                    ? 'bg-[var(--primary)] scale-125'
                                    : i < step
                                        ? 'bg-[var(--primary)]/50'
                                        : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 flex items-center justify-center pt-24 pb-8 px-4">
                <div className="w-full max-w-lg">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                            <CurrentStepComponent
                                onNext={handleNext}
                                onBack={handleBack}
                                profile={profile}
                                experiences={experiences}
                                education={education}
                                projects={projects}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
