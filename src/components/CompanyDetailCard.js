"use client";

import { useState, useEffect } from 'react';
import {
    ArrowLeft, Linkedin, Loader2, FileText, Send,
    Building2, Briefcase, Users, Sparkles, ExternalLink,
    Lightbulb, Copy, Check, ChevronDown, ChevronUp, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Company Detail Card - Shown after "Intéressé"
 * User must select a suggestion before generating CV/Letter
 */
export default function CompanyDetailCard({ company, userProfile, onBack, onGenerateCV, onGenerateLetter }) {
    const [findingContact, setFindingContact] = useState(false);
    const [contact, setContact] = useState(null);
    const [contactError, setContactError] = useState(null);
    const [personalizedPitch, setPersonalizedPitch] = useState(null);
    const [loadingPitch, setLoadingPitch] = useState(true);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);

    // Company data
    const sector = company.sector || null;
    const pitch = company.pitch || null;
    const stack = company.stack || [];
    const initials = company.initials || company.company?.substring(0, 2).toUpperCase() || '?';

    // Fetch personalized description + suggestions on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoadingPitch(true);
            try {
                const res = await fetch('/api/stationf/personalize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        company_name: company.company,
                        company_description: company.description || null,
                        sector: sector,
                        positions: (company.positions || []).slice(0, 5).map(p => p.title),
                        user_skills: userProfile?.skills || [],
                        user_objectif: userProfile?.objectif || 'Développeur',
                        user_contrat: userProfile?.contrat_recherche || 'alternance'
                    })
                });
                const data = await res.json();
                if (data.success && data.personalized) {
                    setPersonalizedPitch(data.personalized);
                }
            } catch (err) {
                console.error('Error fetching personalized pitch:', err);
            } finally {
                setLoadingPitch(false);
            }

            setLoadingSuggestions(true);
            try {
                const res = await fetch('/api/stationf/suggest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        company_name: company.company,
                        sector: sector,
                        positions: (company.positions || []).map(p => p.title),
                        stack: stack,
                        user_skills: userProfile?.skills || [],
                        user_objectif: userProfile?.objectif || 'Développeur'
                    })
                });
                const data = await res.json();
                if (data.success && data.suggestions) {
                    setSuggestions(data.suggestions);
                }
            } catch (err) {
                console.error('Error fetching suggestions:', err);
            } finally {
                setLoadingSuggestions(false);
            }
        };
        fetchData();
    }, [company, userProfile, sector, stack]);

    const handleCopyPhrase = (phrase, index) => {
        navigator.clipboard.writeText(phrase);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleSelectSuggestion = (suggestion, index) => {
        if (selectedSuggestion === index) {
            setSelectedSuggestion(null);
        } else {
            setSelectedSuggestion(index);
        }
    };

    const handleFindContact = async () => {
        if (findingContact || contact) return;
        setFindingContact(true);
        setContactError(null);
        try {
            const res = await fetch('/api/stationf/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_name: company.company })
            });
            const data = await res.json();
            if (data.success && data.contact?.linkedin_url) {
                setContact(data.contact);
            } else {
                setContactError("Contact non trouvé");
            }
        } catch (err) {
            setContactError("Erreur de recherche");
        } finally {
            setFindingContact(false);
        }
    };

    const handleGenerateCV = () => {
        if (selectedSuggestion !== null && suggestions[selectedSuggestion]) {
            const suggestion = suggestions[selectedSuggestion];
            onGenerateCV?.({
                company: company.company,
                role: suggestion.title,
                department: suggestion.department,
                phrase: suggestion.phrase
            });
        }
    };

    const handleGenerateLetter = () => {
        if (selectedSuggestion !== null && suggestions[selectedSuggestion]) {
            const suggestion = suggestions[selectedSuggestion];
            onGenerateLetter?.({
                company: company.company,
                role: suggestion.title,
                department: suggestion.department,
                phrase: suggestion.phrase,
                pitch: personalizedPitch
            });
        }
    };

    const confidenceColor = (conf) => {
        const c = conf?.toLowerCase();
        // Green for high/fort
        if (c === 'fort' || c === 'high') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        // Orange for moyen/medium  
        if (c === 'moyen' || c === 'medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        // Blue for élevé (elevated)
        if (c === 'élevé' || c === 'elevated') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        return 'bg-white/10 text-white/50 border-white/20';
    };

    // Sort suggestions by confidence: fort/high > élevé > moyen/medium
    const confidencePriority = { 'fort': 0, 'high': 0, 'élevé': 1, 'elevated': 1, 'moyen': 2, 'medium': 2 };
    const sortedSuggestions = [...suggestions].sort((a, b) => {
        const priorityA = confidencePriority[a.confidence] ?? 3;
        const priorityB = confidencePriority[b.confidence] ?? 3;
        return priorityA - priorityB;
    });

    const selectedSuggestionData = selectedSuggestion !== null ? sortedSuggestions[selectedSuggestion] : null;

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="glass gradient-border rounded-3xl p-5 relative overflow-hidden h-full flex flex-col shadow-2xl shadow-black/80"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10 pointer-events-none" />

            <div className="relative flex-1 flex flex-col z-10 overflow-y-auto custom-scrollbar pr-1">

                <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-3 w-fit">
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                </button>

                {/* HEADER */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/30 to-[var(--secondary)]/30 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-white/80">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-extrabold text-white truncate">{company.company}</h1>
                        {pitch && <p className="text-xs text-white/60 truncate">{pitch}</p>}
                        <div className="flex gap-1.5 mt-1">
                            {sector && <span className="px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-medium rounded">{sector}</span>}
                            <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-medium rounded">Station F</span>
                        </div>
                    </div>
                </div>

                {/* AI PITCH */}
                <div className="mb-4 p-3 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--secondary)]/10 border border-[var(--primary)]/20 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">
                        <Sparkles className="w-3 h-3" />
                        Pourquoi cette entreprise
                    </div>
                    {loadingPitch ? (
                        <div className="flex items-center gap-2 text-white/50">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-xs">Analyse...</span>
                        </div>
                    ) : (
                        <p className="text-xs text-white/80 leading-relaxed">{personalizedPitch || 'Startup innovante.'}</p>
                    )}
                </div>

                {/* SUGGESTIONS - User must select one */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                            <Lightbulb className="w-3 h-3" />
                            Choisis ton domaine
                        </div>
                        {selectedSuggestion !== null && (
                            <span className="text-[10px] text-emerald-400">✓ Sélectionné</span>
                        )}
                    </div>

                    {loadingSuggestions ? (
                        <div className="flex items-center gap-2 text-white/50 p-3 bg-white/5 rounded-lg">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-xs">Génération...</span>
                        </div>
                    ) : sortedSuggestions.length > 0 ? (
                        <div className="space-y-2">
                            {sortedSuggestions.map((s, i) => (
                                <motion.div
                                    key={i}
                                    onClick={() => handleSelectSuggestion(s, i)}
                                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${selectedSuggestion === i
                                        ? 'bg-[var(--primary)]/20 border-[var(--primary)]/50 ring-1 ring-[var(--primary)]/30'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {selectedSuggestion === i && (
                                                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                                                )}
                                                <span className={`font-medium text-sm ${selectedSuggestion === i ? 'text-[var(--primary)]' : 'text-white'}`}>
                                                    {s.title}
                                                </span>
                                                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${confidenceColor(s.confidence)}`}>
                                                    {s.confidence}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-white/40 mt-0.5 ml-6">{s.department} • {s.proof}</p>
                                        </div>
                                        <div
                                            onClick={(e) => { e.stopPropagation(); handleCopyPhrase(s.phrase, i); }}
                                            className="p-1.5 text-white/40 hover:text-[var(--primary)] bg-white/5 rounded cursor-pointer"
                                            title="Copier la phrase"
                                        >
                                            {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-3 bg-white/5 rounded-lg text-center">
                            <p className="text-white/50 text-xs">Pas de suggestions</p>
                        </div>
                    )}
                </div>

                {/* CONTACT */}
                <div className="mb-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                        <Users className="w-3 h-3" />
                        Contact
                    </div>

                    {contact ? (
                        <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium text-sm">{contact.name}</p>
                                <p className="text-[10px] text-blue-400">{contact.title}</p>
                            </div>
                            <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600">
                                <Linkedin className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    ) : (
                        <button onClick={handleFindContact} disabled={findingContact}
                            className="w-full py-2 flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs font-medium hover:bg-blue-500/20 disabled:opacity-50">
                            {findingContact ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Recherche...</>
                                : contactError ? <span className="text-red-400">{contactError}</span>
                                    : <><Linkedin className="w-3.5 h-3.5" />Trouver le CEO/RH</>}
                        </button>
                    )}
                </div>

            </div>

            {/* ACTION BUTTONS - Disabled until selection */}
            <div className="mt-2 pt-2 border-t border-white/10">
                {selectedSuggestion === null ? (
                    <div className="text-center py-2">
                        <p className="text-white/40 text-xs">👆 Sélectionne un domaine pour générer CV/Lettre</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-[10px] text-white/50 text-center">
                            Pour: <span className="text-[var(--primary)] font-medium">{selectedSuggestionData?.title}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleGenerateCV}
                                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-xs hover:bg-white/10"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Générer CV
                            </button>
                            <button
                                onClick={handleGenerateLetter}
                                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold text-xs shadow-lg shadow-[var(--primary)]/25 hover:scale-[1.02]"
                            >
                                <Send className="w-3.5 h-3.5" />
                                Lettre de motiv
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
