'use client'
import JobFilters from './JobFilters'
import { useState } from 'react'
import JobSwiper from './JobSwiper'
import OnboardingModal from './OnboardingModal'
import SwipeTutorial from './SwipeTutorial'


function JobPageClient({ jobs, profileStrength = 100, missingItems = [] }) {
    const [filters, setFilters] = useState({
        location: '',
        contractType: '',
        source: '',
        remoteOnly: false,
        hasRecruiter: false,
    })

    // Filter jobs based on user's filter choices
    const filteredJobs = jobs.filter(job => {
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

        // Source filter
        if (filters.source) {
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

    return (
        <div>
            {/* Onboarding Modal - shows if profile < 70% complete */}
            <OnboardingModal
                profileStrength={profileStrength}
                missingItems={missingItems}
            />

            {/* Swipe Tutorial - shows on first visit */}
            <SwipeTutorial />

            <JobFilters jobs={jobs} filters={filters} onFilterChange={setFilters} />
            <JobSwiper jobs={filteredJobs} />
        </div>
    )
}

export default JobPageClient
