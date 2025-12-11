'use client'
import JobFilters from './JobFilters'
import { useState } from 'react'
import JobSwiper from './JobSwiper'


function JobPageClient({ jobs }) {
    const [filters, setFilters] = useState({
        location: '',
        jobType: '',
    })

    // Filter jobs based on user's filter choices
    const filteredJobs = jobs.filter(job => {
        // If location filter is set, check if job location matches
        if (filters.location) {
            const jobCity = job.location_city?.toLowerCase() || '';
            if (!jobCity.includes(filters.location.toLowerCase())) {
                return false;  // Don't include this job
            }
        }
        return true;  // Include this job
    });

    return (
        <div>
            <JobFilters jobs={jobs} filters={filters} onFilterChange={setFilters} />
            <JobSwiper jobs={filteredJobs} />
        </div>
    )
}

export default JobPageClient