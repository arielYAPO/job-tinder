'use client'
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Hand, ArrowLeft, ArrowRight, Heart, X, Check, MousePointer } from 'lucide-react';

// Sample job cards for tutorial
const sampleJobs = [
    {
        id: 1,
        title: 'Développeur Full Stack',
        company: 'TechCorp Paris',
        location: 'Paris',
        type: 'Alternance',
        isSample: true
    },
    {
        id: 2,
        title: 'Data Analyst Junior',
        company: 'DataViz Lyon',
        location: 'Lyon',
        type: 'Stage',
        isSample: true
    }
];

export default function StepSwipeTutorial({ onNext }) {
    const [tutorialStep, setTutorialStep] = useState(0);
    const [swipedCards, setSwipedCards] = useState([]);

    const instructions = [
        {
            title: 'Swipe right to like',
            description: "Drag the card right or tap the heart. This saves the job and lets you generate a tailored CV.",
            icon: Heart,
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            direction: 'right'
        },
        {
            title: 'Swipe left to pass',
            description: "Not interested? Drag left or tap X to skip and see the next job.",
            icon: X,
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            direction: 'left'
        },
        {
            title: "You're ready!",
            description: "That's it! Start swiping to find your dream job. Your liked jobs appear in 'My CVs'.",
            icon: Check,
            color: 'text-[var(--primary)]',
            bgColor: 'bg-[var(--primary)]/20',
            direction: null
        }
    ];

    const currentInstruction = instructions[tutorialStep];

    const handleSwipe = (direction) => {
        if (tutorialStep < 2) {
            setSwipedCards([...swipedCards, tutorialStep]);
            setTutorialStep(tutorialStep + 1);
        }
    };

    const handleComplete = () => {
        onNext();
    };

    return (
        <div className="glass gradient-border rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10 pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                        How to swipe
                    </h2>
                    <div className="flex justify-center gap-2 mb-4">
                        {instructions.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all ${i === tutorialStep
                                    ? 'bg-[var(--primary)] scale-125'
                                    : i < tutorialStep
                                        ? 'bg-[var(--primary)]/50'
                                        : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Demo Card Area */}
                <div className="relative h-64 mb-6">
                    {tutorialStep < 2 ? (
                        <>
                            {/* Background card */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-6 opacity-30 transform scale-95">
                                    <div className="h-4 w-2/3 bg-white/10 rounded mb-2" />
                                    <div className="h-3 w-1/2 bg-white/10 rounded mb-4" />
                                    <div className="h-3 w-full bg-white/5 rounded" />
                                </div>
                            </div>

                            {/* Active demo card */}
                            <motion.div
                                key={tutorialStep}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <motion.div
                                    drag="x"
                                    dragConstraints={{ left: -100, right: 100 }}
                                    onDragEnd={(e, info) => {
                                        if (info.offset.x > 50 && currentInstruction.direction === 'right') {
                                            handleSwipe('right');
                                        } else if (info.offset.x < -50 && currentInstruction.direction === 'left') {
                                            handleSwipe('left');
                                        }
                                    }}
                                    whileDrag={{ scale: 1.02 }}
                                    className="w-full max-w-xs bg-[var(--surface-elevated)] border border-white/10 rounded-2xl p-6 cursor-grab active:cursor-grabbing"
                                >
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                                        SAMPLE
                                    </div>
                                    <h3 className="font-bold text-white text-lg mb-1 mt-2">
                                        {sampleJobs[tutorialStep]?.title}
                                    </h3>
                                    <p className="text-[var(--primary)] text-sm font-medium mb-2">
                                        {sampleJobs[tutorialStep]?.company}
                                    </p>
                                    <div className="flex gap-2 text-xs text-[var(--foreground-muted)]">
                                        <span className="px-2 py-1 bg-white/5 rounded-lg">
                                            {sampleJobs[tutorialStep]?.location}
                                        </span>
                                        <span className="px-2 py-1 bg-white/5 rounded-lg">
                                            {sampleJobs[tutorialStep]?.type}
                                        </span>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Swipe indicator animation */}
                            <motion.div
                                animate={{
                                    x: currentInstruction.direction === 'right' ? [0, 30, 0] : [0, -30, 0],
                                    opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            >
                                <Hand className="w-12 h-12 text-white/30" />
                            </motion.div>
                        </>
                    ) : (
                        // Completion state
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="h-full flex items-center justify-center"
                        >
                            <div className="text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-full flex items-center justify-center"
                                >
                                    <Check className="w-10 h-10 text-white" />
                                </motion.div>
                                <p className="text-[var(--foreground-muted)]">
                                    You got it! 🎉
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Current instruction */}
                <motion.div
                    key={tutorialStep}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-6"
                >
                    <div className={`inline-flex items-center gap-2 px-4 py-2 ${currentInstruction.bgColor} rounded-full mb-3`}>
                        <currentInstruction.icon className={`w-5 h-5 ${currentInstruction.color}`} />
                        <span className={`font-bold ${currentInstruction.color}`}>
                            {currentInstruction.title}
                        </span>
                    </div>
                    <p className="text-[var(--foreground-muted)] text-sm">
                        {currentInstruction.description}
                    </p>
                </motion.div>

                {/* Action buttons */}
                {tutorialStep < 2 ? (
                    <div className="flex justify-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => currentInstruction.direction === 'left' && handleSwipe('left')}
                            disabled={currentInstruction.direction !== 'left'}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition ${currentInstruction.direction === 'left'
                                ? 'bg-red-500/20 border-2 border-red-500 text-red-500'
                                : 'bg-white/5 border border-white/10 text-[var(--foreground-dim)]'
                                }`}
                        >
                            <X className="w-6 h-6" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => currentInstruction.direction === 'right' && handleSwipe('right')}
                            disabled={currentInstruction.direction !== 'right'}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition ${currentInstruction.direction === 'right'
                                ? 'bg-green-500/20 border-2 border-green-500 text-green-500'
                                : 'bg-white/5 border border-white/10 text-[var(--foreground-dim)]'
                                }`}
                        >
                            <Heart className="w-6 h-6" />
                        </motion.button>
                    </div>
                ) : (
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleComplete}
                        className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-2xl hover:glow-primary transition-all flex items-center justify-center gap-2"
                    >
                        Start swiping for real!
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>
                )}

                {/* Skip option */}
                {tutorialStep < 2 && (
                    <button
                        onClick={handleComplete}
                        className="w-full mt-4 py-2 text-[var(--foreground-dim)] text-sm hover:text-white transition"
                    >
                        Skip tutorial
                    </button>
                )}
            </div>
        </div>
    );
}
