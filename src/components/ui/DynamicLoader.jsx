import React, { useState, useEffect } from 'react';

// Les phrases qui vont défiler pour faire patienter l'utilisateur
const LOADING_MESSAGES = [
    "🔍 Analyse de votre nouveau rôle cible...",
    "🧠 Calcul du matching avec notre base de données...",
    "🏢 Filtrage des startups de Station F...",
    "⚡️ Finalisation de votre classement personnalisé...",
    "✨ Presque terminé..."
];

export default function DynamicLoader() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        // Change le texte toutes les 2500 millisecondes (2.5 secondes)
        const interval = setInterval(() => {
            setMessageIndex((current) => {
                // S'il arrive à la fin de la liste, il reste sur le dernier message
                if (current === LOADING_MESSAGES.length - 1) return current;
                return current + 1;
            });
        }, 2500);

        // Nettoyage quand le composant disparaît
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-10 space-y-6">
            {/* Le petit spinner (roue qui tourne) stylé avec Tailwind */}
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

            {/* Le texte qui change, avec une petite animation "pulse" */}
            <p className="text-lg font-medium text-gray-700 animate-pulse text-center">
                {LOADING_MESSAGES[messageIndex]}
            </p>

            <p className="text-sm text-gray-400">
                Notre IA évalue plus de 500 entreprises pour vous...
            </p>
        </div>
    );
}
