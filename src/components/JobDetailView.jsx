"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Zap, User, Sparkles, Search, Mail, Radio, Calendar } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { fetchMatchedCompanies, buildUserProfile, buildSearchPreferences, triggerLazyEnrichment } from '@/lib/jobService';

import DynamicLoader from '@/components/ui/DynamicLoader';

// --- SCORE RING COMPONENT ---
function ScoreRing({ score, size = 76 }) {
    const isHigh = score >= 50;
    const radius = 22;
    const stroke = 6;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const color = isHigh ? 'text-emerald-400' : 'text-violet-400';
    const shadowClass = isHigh ? 'drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]' : 'drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]';

    return (
        <div className="relative grid place-items-center" style={{ width: size, height: size }}>
            <svg className={`${shadowClass}`} style={{ width: size, height: size }} viewBox="0 0 56 56">
                <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(63,63,70,0.55)" strokeWidth={stroke} />
                <circle
                    cx="28" cy="28" r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    className={color}
                    style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transition: 'stroke-dashoffset 260ms ease'
                    }}
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                    <div className={`text-sm font-bold ${color}`}>{score}%</div>
                    <div className={`text-[10px] uppercase tracking-widest ${color} mt-0.5`}>Match</div>
                </div>
            </div>
        </div>
    );
}

// --- COMPANY LOGO COMPONENT ---
function CompanyLogo({ company, size = 'sm' }) {
    const sizeClasses = {
        sm: 'h-7 w-7 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base'
    };

    const isUrl = company.logo_url && company.logo_url.startsWith('http');
    const initials = company.name?.substring(0, 1).toUpperCase() || '?';

    if (isUrl) {
        return (
            <img
                src={company.logo_url}
                alt={company.name}
                className={`${sizeClasses[size]} rounded bg-white object-cover`}
            />
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded bg-white grid place-items-center text-black font-extrabold`}>
            {initials}
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function JobDetailView() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userName, setUserName] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const router = useRouter();

    // Inline profile editing states
    const [editObjective, setEditObjective] = useState('');
    const [editContractType, setEditContractType] = useState('alternance');
    const [editSkills, setEditSkills] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);
    const [isProfileMandatory, setIsProfileMandatory] = useState(false);

    // Contact Finder State
    const [contact, setContact] = useState(null);
    const [loadingContact, setLoadingContact] = useState(false);
    const [contactError, setContactError] = useState(null);
    const [feedbackState, setFeedbackState] = useState('idle'); // idle | selecting | sent

    // Freemium credits state
    const [usage, setUsage] = useState({ searches: 0, emails: 0, maxSearches: 3, maxEmails: 5 });
    const [rateLimitMessage, setRateLimitMessage] = useState(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch data on mount
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                // Get user profile
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                // Save user for edit modal
                setCurrentUser(user);
                // Set user name from email
                setUserName(user.email?.split('@')[0] || 'Utilisateur');

                let profile = null;
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (profileData) {
                    profile = {
                        skills: profileData.skills || [],
                        objective: profileData.desired_position || 'Développeur',
                        contract_type: profileData.contract_type || 'Stage'
                    };
                    // Use full name if available
                    if (profileData.full_name) {
                        setUserName(profileData.full_name);
                    }
                } else {
                    // Fallback if profile exists but is empty? Or maybe redirect to onboarding?
                    // For now, keep it simple or set empty default
                    profile = {
                        skills: [],
                        objective: 'Développeur',
                        contract_type: 'alternance'
                    };
                }

                if (!profile.skills || profile.skills.length === 0) {
                    setIsProfileMandatory(true);
                    setShowProfileModal(true);
                }


                setUserProfile(profile);

                // Load usage credits
                const { data: usageData } = await supabase
                    .from('profiles')
                    .select('searches_used, emails_used, last_reset_date')
                    .eq('user_id', user.id)
                    .single();

                if (usageData) {
                    const today = new Date().toISOString().split('T')[0];
                    const isNewDay = usageData.last_reset_date !== today;
                    setUsage({
                        searches: isNewDay ? 0 : (usageData.searches_used || 0),
                        emails: isNewDay ? 0 : (usageData.emails_used || 0),
                        maxSearches: 3,
                        maxEmails: 5
                    });
                }

                // Fetch matched companies (no rate limit — matching is free)
                const result = await fetchMatchedCompanies(
                    buildUserProfile(profile),
                    buildSearchPreferences({})
                );

                if (result.success && result.companies) {
                    setCompanies(result.companies);
                    // Store company names for targeted enrichment later
                    window.__matchedCompanyNames = result.companies.map(c => c.name);
                } else {
                    setError('Aucun match trouvé');
                }
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Erreur de chargement');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    // Sync edit fields when profile loaded
    useEffect(() => {
        if (userProfile) {
            setEditObjective(userProfile.objective || '');
            setEditContractType(userProfile.contract_type || 'alternance');
            setEditSkills(userProfile.skills?.join(', ') || '');
        }
    }, [userProfile]);

    // Reset contact state when company changes
    useEffect(() => {
        setContact(null);
        setContactError(null);
        setLoadingContact(false);
        setFeedbackState('idle');
    }, [selectedCompany]);

    // Handle feedback submission
    async function handleFeedback(type) {
        try {
            await supabase.from('feedbacks').insert([{
                company_name: selectedCompany?.name || 'Unknown',
                contact_name: contact?.name || null,
                feedback_type: type
            }]);
            setFeedbackState('sent');
        } catch (err) {
            console.error('Feedback error:', err);
            setFeedbackState('sent'); // Show success anyway for UX
        }
    }

    // Save profile inline
    async function saveProfile() {
        if (!currentUser) return;

        const skillsArray = editSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);

        if (skillsArray.length === 0) {
            alert("Ajoute au moins une compétence (ex: Python, React) pour que le matching fonctionne !");
            return;
        }

        setSaving(true);
        setLoading(true); // User feedback: show main loader
        setSaveSuccess(false);

        try {

            // 1. Update Profile in DB
            const { error } = await supabase
                .from('profiles')
                .update({
                    skills: skillsArray,
                    desired_position: editObjective,
                    contract_type: editContractType
                })
                .eq('user_id', currentUser.id);

            if (error) throw error;

            // Update local state
            setUserProfile({
                ...userProfile,
                skills: skillsArray,
                objective: editObjective,
                contract_type: editContractType
            });

            setSaveSuccess(true);
            setIsProfileMandatory(false); // Enable closing after save
            setTimeout(() => setShowProfileModal(false), 1500); // Auto close after success if wanted, or let user close

            // 2. Trigger AI Enrichment (Background / Parallel)
            // We set a loading state for the UI but don't strictly block the user
            setIsEnriching(true);

            // Fire enrichment but don't wait indefinitely if it's slow? 
            // Actually, we want to wait to fetch the *new* enriched matches.
            // But 20 companies * 2s = 40s is too long. 
            // Strategy: Trigger it, let it run, and maybe user refreshes later.
            // OR drastically reduce limit for immediate feedback? 
            // For now, we await it to ensure QUALITY over speed, as user requested "perfect".
            // But we'll limit to 10 for speed in this context.

            try {
                // Pass matched company names to avoid re-fetching all 2000+ jobs
                const companyNames = window.__matchedCompanyNames || [];
                const enrichResult = await triggerLazyEnrichment(currentUser.id, companyNames);
                if (enrichResult.rateLimited) {
                    setRateLimitMessage(enrichResult.message);
                    if (enrichResult.remaining !== undefined) {
                        setUsage(prev => ({ ...prev, searches: prev.maxSearches }));
                    }
                } else if (enrichResult.remaining !== undefined) {
                    setUsage(prev => ({ ...prev, searches: prev.maxSearches - enrichResult.remaining }));
                }
            } catch (e) {
                console.warn("Enrichment trigger warning:", e);
            }

            // 3. Re-fetch matches with new profile & new enrichment data
            const result = await fetchMatchedCompanies(
                buildUserProfile({
                    skills: skillsArray,
                    objective: editObjective,
                    contract_type: editContractType
                }),
                buildSearchPreferences({})
            );

            if (result.success && result.companies) {
                setCompanies(result.companies);
                window.__matchedCompanyNames = result.companies.map(c => c.name);
                router.refresh(); // Tells Next.js to refresh server components/cache
            }

            setIsEnriching(false);
            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (err) {
            console.error('Error saving profile:', err);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
            setLoading(false); // Hide main loader
            setIsEnriching(false);
        }
    }

    // --- CONTACT FINDER FUNCTION ---
    async function handleFindContact() {
        if (!selectedCompany) return;

        setLoadingContact(true);
        setContactError(null);
        setContact(null);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company: selectedCompany.name,
                    job: "CTO" // Par défaut on cherche le CTO
                })
            });

            const data = await response.json();

            if (data.rateLimited) {
                setContactError(data.message || "Limite atteinte");
            } else if (data.success) {
                setContact(data);
                if (data.remaining !== undefined) {
                    setUsage(prev => ({ ...prev, emails: prev.maxEmails - data.remaining }));
                }
            } else {
                setContactError(data.message || "Contact introuvable");
            }

        } catch (err) {
            console.error("Erreur contact:", err);
            setContactError("Erreur lors de la recherche");
        } finally {
            setLoadingContact(false);
        }
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 sm:px-6 lg:px-10 py-8">
            <div className="max-w-6xl mx-auto">

                {/* === TOP BAR === */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 backdrop-blur px-4 py-2 hover:bg-white/10 transition"
                        >
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 border border-violet-400/20">
                                <User className="h-5 w-5 text-violet-200" />
                            </span>
                            <span className="text-left">
                                <span className="block text-sm font-semibold">Mon Profil</span>
                                <span className="block text-xs text-zinc-400">Compléter pour + de matchs</span>
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Credit Badges */}
                        <div className="hidden sm:flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${usage.searches >= usage.maxSearches
                                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                : 'border-violet-400/20 bg-violet-500/10 text-violet-200'
                                }`}>
                                <Search className="w-3.5 h-3.5" />
                                {usage.maxSearches - usage.searches}/{usage.maxSearches}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${usage.emails >= usage.maxEmails
                                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                : 'border-sky-400/20 bg-sky-500/10 text-sky-200'
                                }`}>
                                <Mail className="w-3.5 h-3.5" />
                                {usage.maxEmails - usage.emails}/{usage.maxEmails}
                            </span>
                        </div>

                        {isEnriching && (
                            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-200 animate-pulse">
                                <Sparkles className="h-4 w-4" />
                                Matching en cours...
                            </span>
                        )}

                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                router.push('/login');
                            }}
                            className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 transition"
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>

                {/* === HEADER === */}
                <header className="text-center mt-10 mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        {loading ? '...' : `${companies.length} Matchs Trouvés`}
                    </h1>
                    <p className="mt-3 text-zinc-400">
                        Voici les entreprises qui correspondent le mieux à ton profil{' '}
                        <span className="text-zinc-300 font-medium">{userProfile?.objective || 'Développeur'}</span>.
                    </p>
                </header>

                {/* === CONTEXT PILLS === */}
                {userProfile && (
                    <section className="mb-8">
                        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 sm:px-6 py-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-sm text-zinc-400">Contexte :</span>

                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/40 px-3 py-1.5 text-sm">
                                    <span className="text-zinc-300">Rôle :</span>
                                    <span className="text-white">{userProfile.objective}</span>
                                </span>


                            </div>
                        </div>
                    </section>
                )}

                {/* === LOADING STATE === */}
                {loading && (
                    <div className="py-20">
                        <DynamicLoader />
                    </div>
                )}

                {/* === ERROR STATE === */}
                {error && !loading && (
                    <div className="text-center py-20">
                        <p className="text-zinc-400">{error}</p>
                    </div>
                )}

                {/* === STRATEGY BANNER === */}
                {!loading && !error && companies.length > 0 && (
                    <div className="mb-8 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span className="text-xl">💡</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-200 text-lg mb-1">Stratégie du Marché Caché</h3>
                                <p className="text-blue-100/80 text-sm leading-relaxed">
                                    Les entreprises ci-dessous matchent avec vos compétences. Ce ne sont pas des offres actives, mais des <strong>signaux forts</strong>.
                                    Utilisez notre outil pour trouver le CTO et envoyez une candidature spontanée ultra-ciblée !
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* === COMPANY LIST === */}
                {!loading && !error && (
                    <motion.section
                        className="space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {companies.map((company, index) => {
                            const isHigh = company.score >= 50;
                            const glowClass = isHigh
                                ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.30),0_20px_80px_rgba(16,185,129,0.10)]'
                                : 'shadow-[0_0_0_1px_rgba(168,85,247,0.35),0_20px_80px_rgba(168,85,247,0.12)]';

                            return (
                                <motion.article
                                    key={`${company.slug || company.name}-${index}`}
                                    variants={itemVariants}
                                    onClick={() => setSelectedCompany(company)}
                                    className={`group cursor-pointer rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-5 hover:bg-white/10 hover:border-white/20 transition ${glowClass}`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                                        {/* Score Ring */}
                                        <div className="shrink-0 flex items-center gap-4">
                                            <ScoreRing score={company.score || 0} />
                                        </div>

                                        {/* Company Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <CompanyLogo company={company} size="sm" />
                                                <h3 className="text-xl font-semibold truncate">{company.name}</h3>
                                                <span className="hidden sm:inline text-xs text-zinc-500">•</span>
                                                <span className="hidden sm:inline text-xs text-zinc-500 uppercase tracking-wider">
                                                    {company.location || 'France'}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-sm text-zinc-300/90 line-clamp-2">
                                                {company.matchReason || `Match basé sur ${company.jobs?.length || 0} opportunité(s) détectée(s).`}
                                            </p>

                                            <div className="mt-3">
                                                <span className="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
                                                    {company.jobs?.length || 0} Opportunités
                                                </span>
                                            </div>
                                        </div>

                                        {/* Arrow Button */}
                                        <div className="shrink-0 flex items-center justify-end gap-3">
                                            <button className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-violet-500/15 hover:border-violet-400/30 transition">
                                                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </motion.section>
                )}

                {/* === FOOTER TIP === */}
                {!loading && companies.length > 0 && (
                    <footer className="mt-10 text-center text-xs text-zinc-500">
                        Astuce : clique sur une ligne pour ouvrir le panneau de détails.
                    </footer>
                )}
            </div>

            {/* === DRAWER OVERLAY === */}
            <AnimatePresence>
                {selectedCompany && (
                    <motion.div
                        className="fixed inset-0 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/55"
                            onClick={() => setSelectedCompany(null)}
                        />

                        {/* Drawer */}
                        <motion.aside
                            className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-zinc-950/60 backdrop-blur-xl border-l border-white/10"
                            initial={{ x: 24, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 24, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                        >
                            <div className="h-full overflow-auto">
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-zinc-400">Détails</p>
                                            <h2 className="mt-1 text-2xl font-bold">{selectedCompany.name}</h2>
                                            <p className="mt-1 text-sm text-zinc-400">{selectedCompany.location || 'France'}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCompany(null)}
                                            className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Why it matches - Purple Card */}
                                    <div className="mt-6 rounded-2xl border border-violet-500/25 bg-violet-500/10 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-violet-200">
                                                    Pourquoi ça match ({selectedCompany.score || 0}%)
                                                </p>
                                                <p className="mt-2 text-lg font-semibold">
                                                    {selectedCompany.matchReason}
                                                </p>
                                                {/* Show matched skills from the first job */}
                                                {selectedCompany.jobs?.[0]?.matched_skills?.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {selectedCompany.jobs[0].matched_skills.slice(0, 5).map((skill, i) => (
                                                            <span key={i} className="rounded-full bg-violet-500/20 border border-violet-400/30 px-2 py-0.5 text-xs text-violet-200">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10">
                                                <Sparkles className="h-5 w-5 text-violet-200" />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Opportunities - Green Cards */}
                                    <div className="mt-8">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                                    <Radio className="h-3.5 w-3.5 text-emerald-500/80" />
                                                    Signaux de recrutement tech
                                                </p>
                                                <p className="mt-1 text-[11px] text-zinc-500">Cette entreprise recrute activement :</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    document.getElementById('contact-generator')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="shrink-0 flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                                            >
                                                <Search className="h-3 w-3" />
                                                Contacts ↓
                                            </button>
                                        </div>
                                        <div className="mt-3 space-y-3">
                                            {selectedCompany.jobs?.map((job, idx) => (
                                                <div
                                                    key={idx}
                                                    className="block rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 opacity-90"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-xs font-medium text-emerald-300 uppercase">
                                                                {job.type || job.contract_type || 'Offre'}
                                                            </span>
                                                            {job.potentially_expired && (
                                                                <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-300 uppercase tracking-wide">
                                                                    Potentiellement plus disponible
                                                                </span>
                                                            )}
                                                            {job.score && (
                                                                <span className="text-xs text-zinc-400">
                                                                    {job.score}% match
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/10 bg-emerald-500/5 text-emerald-500/50">
                                                            <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
                                                        </span>
                                                    </div>
                                                    <div className="mt-3">
                                                        <p className="text-lg font-semibold">{job.title}</p>
                                                        {job.published_at && (
                                                            <p className="mt-1.5 text-[11px] text-zinc-400 flex items-center gap-1.5">
                                                                <Calendar className="h-3 w-3 text-zinc-500" />
                                                                Publié le {new Date(job.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </p>
                                                        )}
                                                        <p className="mt-1 text-sm text-zinc-300/80">
                                                            {job.location || selectedCompany.location || 'France'}
                                                        </p>
                                                    </div>
                                                    {/* Show matched skills for this job */}
                                                    {job.matched_skills?.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-1">
                                                            {job.matched_skills.slice(0, 4).map((skill, i) => (
                                                                <span key={i} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {/* Recruitment signal disclaimer */}
                                            <p className="mt-2 text-[11px] text-zinc-500 italic leading-relaxed">
                                                💡 Ces postes montrent une activité de recrutement récente. Ils peuvent être déjà pourvus.
                                            </p>

                                            {(!selectedCompany.jobs || selectedCompany.jobs.length === 0) && (
                                                <p className="text-sm text-zinc-500">Aucune opportunité listée</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* AI Suggestions Section */}
                                    {selectedCompany.ai_suggestions?.length > 0 && (
                                        <div className="mt-8">
                                            <p className="text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                                                Suggestions IA
                                            </p>
                                            <div className="mt-3 space-y-3">
                                                {selectedCompany.ai_suggestions.map((suggestion, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-semibold text-violet-200">
                                                                    {suggestion.role_title}
                                                                </p>
                                                                <p className="mt-1 text-sm text-zinc-300/80">
                                                                    {suggestion.rationale}
                                                                </p>
                                                            </div>
                                                            <span className="shrink-0 rounded-full bg-violet-500/20 border border-violet-400/30 px-2 py-0.5 text-xs font-medium text-violet-300">
                                                                {suggestion.confidence}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact Finder Section */}
                                    <div className="mt-8">
                                        <p className="text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                            <User className="h-3.5 w-3.5 text-emerald-400" />
                                            Contacts Clés
                                        </p>

                                        <div className="mt-3 rounded-xl border border-white/10 bg-zinc-900/50 p-5">
                                            {!contact && !loadingContact && !contactError && (
                                                <div className="text-center">
                                                    {usage.emails >= usage.maxEmails ? (
                                                        <>
                                                            <p className="text-sm text-zinc-500 mb-2">
                                                                Limite de contacts atteinte pour aujourd'hui
                                                            </p>
                                                            <button
                                                                disabled
                                                                className="inline-flex items-center gap-2 rounded-full bg-zinc-700 text-zinc-400 px-5 py-2 text-sm font-bold cursor-not-allowed opacity-50"
                                                            >
                                                                <Sparkles className="h-4 w-4" />
                                                                Trouver le CTO
                                                            </button>
                                                            <p className="text-xs text-zinc-600 mt-2">💎 Revenez demain ou passez Premium</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-zinc-400 mb-4">
                                                                Besoin de contacter un décideur (CTO) ?
                                                            </p>
                                                            <button
                                                                onClick={handleFindContact}
                                                                className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2 text-sm font-bold hover:bg-zinc-200 transition"
                                                            >
                                                                <Sparkles className="h-4 w-4" />
                                                                Trouver le CTO
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {loadingContact && (
                                                <div className="flex flex-col items-center justify-center py-4 text-zinc-400">
                                                    <Sparkles className="h-6 w-6 animate-spin mb-2 text-emerald-400" />
                                                    <span className="text-sm">Recherche du contact en cours...</span>
                                                </div>
                                            )}

                                            {contactError && (
                                                <div className="text-center py-2">
                                                    <p className="text-sm text-red-400 mb-3">{contactError}</p>
                                                    <button
                                                        onClick={handleFindContact}
                                                        disabled={loadingContact}
                                                        className="text-xs underline text-zinc-500 hover:text-white disabled:opacity-50"
                                                    >
                                                        Réessayer
                                                    </button>
                                                </div>
                                            )}

                                            {contact && (
                                                <div className="space-y-4">
                                                    {/* Contact Header */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-300 grid place-items-center font-bold text-lg">
                                                            {contact.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-lg">{contact.name}</p>
                                                            <p className="text-xs text-zinc-500 uppercase tracking-wider">CTO / Tech Lead</p>
                                                        </div>
                                                    </div>

                                                    {/* LinkedIn Link */}
                                                    {contact.linkedin && (
                                                        <a
                                                            href={contact.linkedin}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-300 hover:bg-blue-500/20 transition"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                                            Voir le profil LinkedIn
                                                        </a>
                                                    )}

                                                    {/* Emails List */}
                                                    <div>
                                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Emails suggeres</p>
                                                        <div className="space-y-2">
                                                            {(contact.emails || []).map((email, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                                                                    <span className="text-xs text-zinc-500 font-mono w-4">{idx + 1}.</span>
                                                                    <code className="text-emerald-300 text-sm select-all flex-1 truncate">
                                                                        {email}
                                                                    </code>
                                                                    <button
                                                                        onClick={() => navigator.clipboard.writeText(email)}
                                                                        className="shrink-0 text-zinc-400 hover:text-white transition"
                                                                        title="Copier"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {contact.fromCache && (
                                                        <p className="text-xs text-zinc-600 text-center mt-2">Depuis le cache</p>
                                                    )}

                                                    {/* --- BLOC AVERTISSEMENT & FEEDBACK --- */}
                                                    <div className="mt-4 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                                                        <p className="text-xs text-zinc-400 mb-3">
                                                            <span className="font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded mr-2 text-[10px]">BÊTA</span>
                                                            Notre IA fait de son mieux, mais peut parfois se tromper. Un doute ? Verifiez le profil LinkedIn.
                                                        </p>

                                                        {feedbackState === 'idle' && (
                                                            <button
                                                                onClick={() => setFeedbackState('selecting')}
                                                                className="text-xs text-zinc-500 hover:text-red-400 underline flex items-center transition-colors"
                                                            >
                                                                Signaler une erreur sur ce contact
                                                            </button>
                                                        )}

                                                        {feedbackState === 'selecting' && (
                                                            <div className="flex flex-wrap gap-2 items-center">
                                                                <span className="text-xs text-zinc-400 font-medium">Quel est le probleme ?</span>
                                                                <button
                                                                    onClick={() => handleFeedback('Mauvais Email')}
                                                                    className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 py-1 px-3 rounded-full transition-colors"
                                                                >
                                                                    Mauvais Email
                                                                </button>
                                                                <button
                                                                    onClick={() => handleFeedback('Mauvais LinkedIn')}
                                                                    className="text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 py-1 px-3 rounded-full transition-colors"
                                                                >
                                                                    Mauvais LinkedIn
                                                                </button>
                                                                <button
                                                                    onClick={() => setFeedbackState('idle')}
                                                                    className="text-xs text-zinc-500 hover:text-zinc-300 ml-1"
                                                                >
                                                                    Annuler
                                                                </button>
                                                            </div>
                                                        )}

                                                        {feedbackState === 'sent' && (
                                                            <p className="text-xs text-emerald-400 font-medium flex items-center">
                                                                Merci ! Le retour a ete envoye au developpeur.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* === PROFILE MODAL (EDITABLE) === */}
            <AnimatePresence>
                {showProfileModal && (
                    <motion.div
                        className="fixed inset-0 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => !isProfileMandatory && setShowProfileModal(false)}
                        />

                        {/* Modal */}
                        <motion.section
                            className="absolute left-1/2 top-1/2 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#1a1a1f] shadow-2xl"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5">
                                <h3 className="text-xl font-bold text-white">Mon Profil</h3>
                                {!isProfileMandatory && (
                                    <button
                                        onClick={() => setShowProfileModal(false)}
                                        className="rounded-full p-2 hover:bg-white/5 transition"
                                    >
                                        <X className="h-5 w-5 text-zinc-400" />
                                    </button>
                                )}
                            </div>

                            {/* Avatar & Name */}
                            <div className="flex flex-col items-center pb-6">
                                <div className="h-20 w-20 rounded-full bg-zinc-700 grid place-items-center">
                                    <User className="h-10 w-10 text-zinc-400" />
                                </div>
                                <p className="mt-4 text-lg font-semibold text-white">{userName || 'John Doe'}</p>
                                <p className="text-sm text-zinc-400">{editObjective || 'Data Scientist Junior'}</p>
                            </div>

                            {/* Success Message */}
                            <AnimatePresence>
                                {saveSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mx-5 mb-4 rounded-xl bg-emerald-500/15 border border-emerald-400/20 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2"
                                    >
                                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Profil sauvegardé !
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Je recherche section */}
                            <div className="mx-5 mb-5 rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                                <p className="text-sm font-semibold text-white mb-4">Je recherche</p>

                                {/* Rôle cible */}
                                <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-3 mb-3">
                                    <p className="text-xs text-zinc-500 mb-1">Rôle cible</p>
                                    <input
                                        type="text"
                                        value={editObjective}
                                        onChange={(e) => setEditObjective(e.target.value)}
                                        placeholder="Ex: Data Scientist, Ingénieur IA..."
                                        className="w-full bg-transparent text-white font-medium focus:outline-none placeholder-zinc-600"
                                    />
                                </div>


                            </div>

                            {/* Mes compétences */}
                            <div className="mx-5 mb-5">
                                <p className="text-sm font-semibold text-white mb-3">Mes compétences</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {editSkills.split(',').filter(s => s.trim()).map((skill, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-zinc-800 px-3 py-1.5 text-sm text-white"
                                        >
                                            {skill.trim()}
                                            <button
                                                onClick={() => {
                                                    const skills = editSkills.split(',').filter(s => s.trim());
                                                    skills.splice(idx, 1);
                                                    setEditSkills(skills.join(', '));
                                                }}
                                                className="hover:text-red-400 transition"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const newSkill = prompt('Ajouter une compétence:');
                                            if (newSkill && newSkill.trim()) {
                                                setEditSkills(prev => prev ? `${prev}, ${newSkill.trim()}` : newSkill.trim());
                                            }
                                        }}
                                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition"
                                    >
                                        + Ajouter
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 border-t border-white/5">
                                {usage.searches >= usage.maxSearches ? (
                                    <div className="text-center">
                                        <button
                                            disabled
                                            className="w-full rounded-full bg-zinc-700 text-zinc-400 px-5 py-2.5 text-sm font-medium cursor-not-allowed opacity-60"
                                        >
                                            ⏳ Limite atteinte (Revenez demain)
                                        </button>
                                        <p className="text-xs text-zinc-600 mt-2">Vous avez utilisé vos 3 analyses IA gratuites aujourd'hui.</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={saveProfile}
                                            disabled={saving}
                                            className="rounded-full border border-white/20 bg-transparent hover:bg-white/5 px-5 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                                        >
                                            {isEnriching ? (
                                                <>
                                                    <Sparkles className="h-4 w-4 animate-spin" />
                                                    Analyse IA en cours...
                                                </>
                                            ) : saving ? (
                                                'Sauvegarde...'
                                            ) : (
                                                'Sauvegarder & relancer'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
