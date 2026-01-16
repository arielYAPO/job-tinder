'use client'
import JobFilters from './JobFilters'
import { useState, useEffect } from 'react'
import JobSwiper from './JobSwiper'
import CompanySwiper from './CompanySwiper'
import OnboardingChecklist from './OnboardingChecklist'
import { Loader2 } from 'lucide-react'

function JobPageClient({
    jobs,
    profileStrength = 100,
    missingItems = [],
    onboardingData = {}
}) {
    const [filters, setFilters] = useState({
        location: '',
        contractType: '',
        source: '',
        remoteOnly: false,
        hasRecruiter: false,
    })

    // Station F companies state
    const [companies, setCompanies] = useState([])
    const [loadingCompanies, setLoadingCompanies] = useState(false)

    // Fetch Station F companies when filter is selected
    useEffect(() => {
        if (filters.source === 'stationf') {
            setLoadingCompanies(true)
            fetch('/api/stationf/companies')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.companies) {
                        setCompanies(data.companies)
                    }
                })
                .catch(err => console.error('Error fetching companies:', err))
                .finally(() => setLoadingCompanies(false))
        }
    }, [filters.source])

    // Filter jobs based on user's filter choices (excluding stationf)
    const filteredJobs = jobs.filter(job => {
        // Skip Station F jobs - they're shown as Company Cards
        if (job.source === 'stationf') {
            return false;
        }

        // Location filter
        if (filters.location) {
            const jobCity = job.location_city?.toLowerCase() || '';
            if (!jobCity.includes(filters.location.toLowerCase())) {
                return false;
            }
        }

        // Contract type filter
        if (filters.contractType) {
            const jobContract = job.contract_type?.toLowerCase() || '';
            if (!jobContract.includes(filters.contractType.toLowerCase())) {
                return false;
            }
        }

        // Source filter (for non-stationf sources)
        if (filters.source && filters.source !== 'stationf') {
            if (job.source !== filters.source) {
                return false;
            }
        }

        // Remote filter
        if (filters.remoteOnly) {
            const remoteMode = job.remote_mode?.toLowerCase() || '';
            if (remoteMode !== 'remote') {
                return false;
            }
        }

        // Has Recruiter filter
        if (filters.hasRecruiter) {
            if (!job.recruiter_name) {
                return false;
            }
        }

        return true;
    });

    // Determine what to show based on filter
    const isStationFMode = filters.source === 'stationf';

    return (
        <div>
            {/* Onboarding Checklist - shows until all tasks complete */}
            <OnboardingChecklist
                profileComplete={onboardingData.profileComplete}
                hasLikedJob={onboardingData.hasLikedJob}
                hasGeneratedCV={onboardingData.hasGeneratedCV}
                hasDownloadedCV={onboardingData.hasDownloadedCV}
            />

            <JobFilters jobs={jobs} filters={filters} onFilterChange={setFilters} />

            {/* Show Company Cards for Station F, Job Cards for others */}
            {isStationFMode ? (
                loadingCompanies ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mb-4" />
                        <p className="text-[var(--foreground-muted)]">Loading Station F companies...</p>
                    </div>
                ) : (
                    <CompanySwiper companies={companies} />
                )
            ) : (
                <JobSwiper
                    jobs={filteredJobs}
                    isFirstLike={!onboardingData.hasLikedJob}
                />
            )}
        </div>
    )
}

export default JobPageClient
