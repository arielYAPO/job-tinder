import React, { useState, useEffect } from 'react';
import { Search, Brain, Building2, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Les étapes et leurs icônes associées
const LOADING_STEPS = [
    { icon: Search, text: "Analyse de votre nouveau rôle cible..." },
    { icon: Brain, text: "Calcul du matching avec notre base de données..." },
    { icon: Building2, text: "Filtrage des startups de Station F..." },
    { icon: Zap, text: "Finalisation de votre classement personnalisé..." },
    { icon: Sparkles, text: "Presque terminé..." }
];

export default function DynamicLoader() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // Change l'étape toutes les 2000 millisecondes (2 secondes)
        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                if (prev === LOADING_STEPS.length - 1) return prev;
                return prev + 1;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const CurrentIcon = LOADING_STEPS[currentIndex].icon;

    return (
        <div className="flex flex-col items-center justify-center p-10 min-h-[300px]">
            {/* Conteneur de l'icône avec un cercle animé */}
            <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
                <div className="relative h-20 w-20 rounded-full bg-zinc-900 border border-violet-500/30 grid place-items-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CurrentIcon className="h-10 w-10 text-violet-400" />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Texte de l'étape actuelle */}
            <div className="h-16 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-xl font-medium text-white text-center"
                    >
                        {LOADING_STEPS[currentIndex].text}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Barre de progression subtile */}
            <div className="w-64 h-1 bg-zinc-800 rounded-full mt-6 overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentIndex + 1) / LOADING_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <p className="mt-4 text-sm text-zinc-500">
                Notre IA évalue plus de 500 entreprises pour vous...
            </p>
        </div>
    );
}
