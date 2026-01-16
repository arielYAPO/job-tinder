'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, RefreshCw, AlertCircle, Sparkles, LayoutGrid, List, User, FileText } from 'lucide-react';
import CompanyCard from '@/components/CompanyCard';
import CompanyDetailCard from '@/components/CompanyDetailCard';
import CompanyGridItem from '@/components/CompanyGridItem';
import GenerationModal from '@/components/GenerationModal';
import EditProfileModal from '@/components/EditProfileModal';
import JobFilters from '@/components/JobFilters';
import createClient from '@/lib/supabase/client';

/**
 * Station F Companies Page
 * Displays companies with AI-powered match scores
 */
export default function StationFPage() {
    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [error, setError] = useState(null);
    const [scraping, setScraping] = useState(false);
    const [stats, setStats] = useState({ total_companies: 0, total_jobs: 0 });
    const [userProfile, setUserProfile] = useState(null);
    const [likedCompany, setLikedCompany] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('cv');
    const [modalData, setModalData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [activeFilters, setActiveFilters] = useState({});
    const [viewMode, setViewMode] = useState('swipe'); // 'swipe' or 'grid'
    const [enrichedOnly, setEnrichedOnly] = useState(false); // Show only jobs with descriptions
    const [targetRole, setTargetRole] = useState(''); // Target role for matching
    const [showProfileModal, setShowProfileModal] = useState(false); // Profile Modal State
    const [profileIncomplete, setProfileIncomplete] = useState(false); // Force onboarding if true

    // Handle Profile Update
    const handleProfileUpdate = (updatedProfile) => {
        setUserProfile(updatedProfile);
        // Check if now complete
        if (updatedProfile?.skills?.length > 0 && updatedProfile?.objectif) {
            setProfileIncomplete(false);
            setShowProfileModal(false);
        }
    };

    // Fetch user profile from Supabase
    const fetchUserProfile = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (profile) {
                    const userProf = {
                        skills: profile.skills || [],
                        formation: profile.education_level || '',
                        objectif: profile.desired_position || '',
                        contrat_recherche: profile.contract_type || 'alternance'
                    };
                    setUserProfile(userProf);

                    // P0: Check if profile is incomplete → force onboarding
                    const isIncomplete = !userProf.skills || userProf.skills.length === 0 || !userProf.objectif;
                    if (isIncomplete) {
                        setProfileIncomplete(true);
                        setShowProfileModal(true);
                    }

                    return profile;
                } else {
                    // No profile at all → force onboarding
                    setProfileIncomplete(true);
                    setShowProfileModal(true);
                    setUserProfile({ skills: [], objectif: '', formation: '', contrat_recherche: 'alternance' });
                }
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
        }

        // Fallback: empty profile → force onboarding
        setProfileIncomplete(true);
        setShowProfileModal(true);
        setUserProfile({ skills: [], objectif: '', formation: '', contrat_recherche: 'alternance' });
        return null;
    };

    // Fetch companies
    const fetchCompaniesWithMatching = async () => {
        setLoading(true);
        setError(null);

        try {
            await fetchUserProfile();
            const res = await fetch(`/api/stationf/companies${enrichedOnly ? '?enrichedOnly=true' : ''}`);
            const data = await res.json();

            if (data.success && data.companies?.length > 0) {
                setCompanies(data.companies);
                setFilteredCompanies(data.companies); // Init filtered
                setStats({
                    total_companies: data.total_companies,
                    total_jobs: data.total_jobs
                });
                setCurrentIndex(0);
            } else {
                setCompanies([]);
                setFilteredCompanies([]);
            }
        } catch (err) {
            console.error('Error fetching companies:', err);
            setError('Failed to load companies.');
        } finally {
            setLoading(false);
        }
    };

    // Run AI matching
    const runAIMatching = async () => {
        if (!userProfile || companies.length === 0) return;

        setMatching(true);

        try {
            // Build preferences object
            const preferences = {
                enriched_only: enrichedOnly
            };

            if (targetRole) {
                preferences.target_roles = [targetRole];
            }

            const res = await fetch('/api/stationf/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_profile: userProfile,
                    preferences: preferences
                })
            });

            const data = await res.json();

            if (data.success && data.matches?.length > 0) {
                const matchedCompanies = companies.map(company => {
                    const match = data.matches.find(m =>
                        m.company?.toLowerCase() === company.company?.toLowerCase()
                    );

                    return {
                        ...company,
                        matchScore: match?.score ?? null,
                        matchReasons: match?.reasons ?? [],
                        hasAIMatch: !!match
                    };
                });

                matchedCompanies.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

                setCompanies(matchedCompanies);
                // Re-apply filters if active
                applyFilters(activeFilters, matchedCompanies);
            }
        } catch (err) {
            console.error('Error running AI matching:', err);
        } finally {
            setMatching(false);
        }
    };

    // Extract unique sectors for filter
    const uniqueSectors = useMemo(() => {
        const sectors = new Set(companies.map(c => c.sector).filter(Boolean));
        return Array.from(sectors).sort();
    }, [companies]);

    // Filter Logic
    const applyFilters = (filters, sourceList = companies) => {
        setActiveFilters(filters);
        let result = sourceList;

        if (filters.sector) {
            result = result.filter(c => c.sector === filters.sector);
        }

        if (filters.stack) {
            const search = filters.stack.toLowerCase();
            result = result.filter(c =>
                c.stack && c.stack.some(tech => tech.toLowerCase().includes(search))
            );
        }

        if (filters.location) {
            // Assuming location is roughly standardized or just check if it exists for now as per simple filter
            // Station F jobs are in Paris, but maybe user wants specific keywords
            // Currently location in DB is "Paris (Station F)".
            // Let's implement basic check
            result = result.filter(c => c.location && c.location.toLowerCase().includes(filters.location.toLowerCase()));
        }

        if (filters.contractType) {
            // Filter company based on having at least one position with that contract
            result = result.filter(c =>
                c.positions && c.positions.some(p => p.contract && p.contract.toLowerCase().includes(filters.contractType.toLowerCase()))
            );
        }

        setFilteredCompanies(result);
        setCurrentIndex(0); // Reset swipe stack
    };

    const handleRefreshScrape = async () => {
        setScraping(true);
        try {
            await fetch('http://127.0.0.1:8000/cache', { method: 'DELETE' });
            await fetchCompaniesWithMatching();
        } catch (err) {
            setError('Failed to refresh.');
        } finally {
            setScraping(false);
        }
    };

    const handleSwipe = (direction) => {
        if (direction === 'right') {
            setLikedCompany(filteredCompanies[currentIndex]);
        } else {
            if (currentIndex < filteredCompanies.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }
        }
    };

    const handleBackFromDetail = () => {
        setLikedCompany(null);
        if (viewMode === 'swipe') {
            if (currentIndex < filteredCompanies.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }
        }
    };

    const handleGenerateCV = (data) => {
        setModalData({ ...data, sector: likedCompany?.sector, pitch: likedCompany?.description });
        setModalType('cv');
        setShowModal(true);
    };

    const handleGenerateLetter = (data) => {
        setModalData({ ...data, sector: likedCompany?.sector, pitch: likedCompany?.description });
        setModalType('letter');
        setShowModal(true);
    };

    useEffect(() => {
        fetchCompaniesWithMatching();
    }, [enrichedOnly]);  // Refetch when enrichedOnly changes

    const currentCompany = filteredCompanies[currentIndex];

    // Toggle View Mode
    const toggleViewMode = () => {
        setViewMode(prev => prev === 'swipe' ? 'grid' : 'swipe');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] p-4 md:p-8">
            {/* Modal for Edit Profile */}
            {showProfileModal && userProfile && (
                <EditProfileModal
                    user={{ id: userId }}
                    profile={userProfile}
                    onClose={() => setShowProfileModal(false)}
                    onSave={handleProfileUpdate}
                />
            )}

            <div className={`${viewMode === 'grid' ? 'max-w-6xl' : 'max-w-md'} mx-auto mb-6 transition-all duration-500`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <span className="text-3xl">🚀</span> Station F
                        </h1>
                        <p className="text-sm text-[var(--foreground-muted)] mt-1">
                            {filteredCompanies.length > 0
                                ? `${filteredCompanies.length} startups trouvées`
                                : 'Aucune entreprise trouvée'
                            }
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {/* Matching Prefs Button */}
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                            title="Préférences de matching"
                        >
                            <User className="w-5 h-5 text-blue-400" />
                        </button>

                        {/* CV Builder Button (NEW) */}
                        <a
                            href="/cv-builder"
                            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                            title="Mon CV"
                        >
                            <FileText className="w-5 h-5 text-purple-400" />
                        </a>

                        {/* Enriched Only Toggle */}
                        <button
                            onClick={() => setEnrichedOnly(!enrichedOnly)}
                            className={`p-3 border rounded-xl transition-colors ${enrichedOnly
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                }`}
                            title={enrichedOnly ? "Showing enriched only (186)" : "Show enriched only"}
                        >
                            <span className="text-xs font-bold">{enrichedOnly ? '✓ AI' : 'AI'}</span>
                        </button>

                        {/* View Mode Toggle */}
                        <button
                            onClick={toggleViewMode}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                            title={viewMode === 'swipe' ? "Vue Grille" : "Vue Swipe"}
                        >
                            {viewMode === 'swipe' ? <LayoutGrid className="w-5 h-5 text-white" /> : <List className="w-5 h-5 text-white" />}
                        </button>


                        <button
                            onClick={runAIMatching}
                            disabled={matching || loading || filteredCompanies.length === 0}
                            className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-colors disabled:opacity-50"
                        >
                            <Sparkles className={`w-5 h-5 text-purple-400 ${matching ? 'animate-pulse' : ''}`} />
                        </button>

                        <button
                            onClick={handleRefreshScrape}
                            disabled={scraping || loading}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 text-white ${scraping ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-6">
                    <JobFilters
                        onFilterChange={(filters) => applyFilters(filters)}
                        availableSectors={uniqueSectors}
                        targetRole={targetRole}
                        onTargetRoleChange={setTargetRole}
                    />
                </div>

            </div>

            <div className={`${viewMode === 'grid' ? 'max-w-6xl' : 'max-w-md'} mx-auto transition-all duration-500`}>
                {loading ? (
                    <div className="glass rounded-3xl p-12 text-center">
                        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mx-auto mb-4" />
                        <p className="text-white font-medium">Chargement des startups...</p>
                    </div>
                ) : error ? (
                    <div className="glass rounded-3xl p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-white font-medium mb-2">Erreur</p>
                        <p className="text-sm text-[var(--foreground-muted)]">{error}</p>
                    </div>
                ) : likedCompany ? (
                    <div className="max-w-md mx-auto">
                        <CompanyDetailCard
                            company={likedCompany}
                            userProfile={userProfile}
                            onBack={handleBackFromDetail}
                            onGenerateCV={handleGenerateCV}
                            onGenerateLetter={handleGenerateLetter}
                        />
                    </div>
                ) : viewMode === 'grid' ? (
                    // === GRID VIEW ===
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredCompanies.map((company, index) => (
                            <CompanyGridItem
                                key={index}
                                company={company}
                                onClick={() => setLikedCompany(company)}
                            />
                        ))}
                    </div>
                ) : (
                    // === SWIPE VIEW ===
                    !currentCompany ? (
                        <div className="glass rounded-3xl p-8 text-center">
                            <span className="text-6xl mb-4 block">🏁</span>
                            <p className="text-white font-medium mb-2">Vous avez tout vu !</p>
                            <p className="text-sm text-[var(--foreground-muted)] mb-6">
                                Modifiez vos filtres ou revenez plus tard.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-xl hover:opacity-90 transition-colors"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    ) : (
                        <CompanyCard
                            company={currentCompany}
                            onSwipe={handleSwipe}
                        />
                    )
                )}
            </div>

            {
                viewMode === 'swipe' && filteredCompanies.length > 0 && currentIndex < filteredCompanies.length && !likedCompany && (
                    <p className="text-center text-xs text-[var(--foreground-dim)] mt-6">
                        {currentCompany?.hasAIMatch
                            ? `✨ Match score: ${currentCompany.matchScore}%`
                            : 'Clique sur ✨ pour lancer le matching IA'
                        }
                    </p>
                )
            }

            <GenerationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                type={modalType}
                data={modalData}
                userId={userId}
            />

            {/* Profile Modal - forced mode when profile incomplete */}
            {showProfileModal && (
                <EditProfileModal
                    user={{ id: userId }}
                    profile={userProfile}
                    onClose={() => setShowProfileModal(false)}
                    onSave={handleProfileUpdate}
                    forced={profileIncomplete}
                />
            )}
        </div >
    );
}
