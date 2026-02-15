/**
 * Job Service - API client for job matching
 * 
 * Handles communication with the Python backend API server for job matching.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/**
 * Fetch matched companies with jobs from the backend.
 * Groups jobs by company and returns sorted by match score.
 * 
 * @param {Object} userProfile - User profile with skills, objective, etc.
 * @param {Object} preferences - Optional search preferences
 * @returns {Promise<Object>} - { success, total_companies, total_jobs, companies[] }
 */
export async function triggerLazyEnrichment(userId) {
    try {
        // limit=20 to be fast enough for UX, force=true to update with new profile
        const response = await fetch(`${API_BASE_URL}/enrich/lazy-top50?limit=20&force=true&user_id=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.warn('[JobService] Trigger enrichment failed:', response.status);
            return { success: false };
        }

        return await response.json();
    } catch (error) {
        console.error('[JobService] Error triggering enrichment:', error);
        return { success: false, error };
    }
}

/**
 * Fetch matched companies with jobs from the backend.
 * Groups jobs by company and returns sorted by match score.
 * 
 * @param {Object} userProfile - User profile with skills, objective, etc.
 * @param {Object} preferences - Optional search preferences
 * @returns {Promise<Object>} - { success, total_companies, total_jobs, companies[] }
 */
export async function fetchMatchedCompanies(userProfile, preferences = null) {
    try {
        const response = await fetch(`${API_BASE_URL}/match-by-company`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_profile: userProfile,
                preferences: preferences
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform logo URLs to ensure we have a fallback
        const companies = (data.companies || []).map(company => ({
            ...company,
            logo: company.logo_url || company.logo || company.name?.substring(0, 2).toUpperCase() || '??'
        }));

        return {
            success: true,
            total_companies: data.total_companies || companies.length,
            total_jobs: data.total_jobs || 0,
            companies
        };
    } catch (error) {
        console.error('[JobService] Error fetching matched companies:', error);
        throw error;
    }
}

/**
 * Fetch matched jobs (flat list, not grouped by company).
 * 
 * @param {Object} userProfile - User profile with skills, objective, etc.
 * @param {Object} preferences - Optional search preferences
 * @returns {Promise<Object>} - { success, count, jobs[] }
 */
export async function fetchMatchedJobs(userProfile, preferences = null) {
    try {
        const response = await fetch(`${API_BASE_URL}/match`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_profile: userProfile,
                preferences: preferences
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[JobService] Error fetching matched jobs:', error);
        throw error;
    }
}

/**
 * Build a user profile object from Supabase profile data.
 * 
 * @param {Object} profile - Supabase profile data
 * @returns {Object} - Formatted user profile for API
 */
export function buildUserProfile(profile) {
    return {
        skills: profile?.skills || [],
        // Backend expects 'objectif' (French spelling)
        objectif: profile?.objective || profile?.desired_position || profile?.goal_type || '',
        roles: profile?.job_preferences?.roles || [],
        keywords: profile?.job_preferences?.keywords || [],
        experience_level: profile?.job_preferences?.experience_level || 'junior',
        languages: profile?.languages || ['French'],
        location: profile?.location || 'Paris'
    };
}


/**
 * Build search preferences from job preferences data.
 * 
 * @param {Object} jobPrefs - Job preferences object
 * @returns {Object|null} - Formatted preferences for API
 */
export function buildSearchPreferences(jobPrefs) {
    if (!jobPrefs) return null;

    return {
        must_have_keywords: jobPrefs.must_have || [],
        excluded_keywords: jobPrefs.excluded || [],
        preferred_contract_types: jobPrefs.contract_types || [],
        strict_intent: jobPrefs.strict_intent || false,
        allow_international: jobPrefs.allow_international ?? true
    };
}
