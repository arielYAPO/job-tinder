/**
 * Job Service - API client for job matching
 * 
 * All calls now go through Next.js API route proxies which handle:
 * - Authentication (user must be logged in)
 * - Rate limiting (3 searches/day, 5 emails/day)
 * - Forwarding to Python backend
 */

/**
 * Trigger lazy enrichment of company data via Gemini.
 * Goes through /api/enrich-proxy (auth required, no separate limit).
 */
export async function triggerLazyEnrichment(userId) {
    try {
        const response = await fetch(`/api/enrich-proxy?limit=20&force=true`, {
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
 * Fetch matched companies with jobs.
 * Goes through /api/match-proxy (auth + 3/day limit).
 * 
 * @param {Object} userProfile - User profile with skills, objective, etc.
 * @param {Object} preferences - Optional search preferences
 * @returns {Promise<Object>} - { success, total_companies, total_jobs, companies[], remaining?, rateLimited? }
 */
export async function fetchMatchedCompanies(userProfile, preferences = null) {
    try {
        const response = await fetch('/api/match-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_profile: userProfile,
                preferences: preferences
            })
        });

        const data = await response.json();

        // Handle rate limiting
        if (data.rateLimited) {
            return {
                success: false,
                rateLimited: true,
                remaining: 0,
                message: data.message
            };
        }

        if (!response.ok) {
            throw new Error(data.detail || data.error || `API error: ${response.status}`);
        }

        // Transform logo URLs to ensure we have a fallback
        const companies = (data.companies || []).map(company => ({
            ...company,
            logo: company.logo_url || company.logo || company.name?.substring(0, 2).toUpperCase() || '??'
        }));

        return {
            success: true,
            total_companies: data.total_companies || companies.length,
            total_jobs: data.total_jobs || 0,
            companies,
            remaining: data.remaining
        };
    } catch (error) {
        console.error('[JobService] Error fetching matched companies:', error);
        throw error;
    }
}

/**
 * Fetch matched jobs (flat list, not grouped by company).
 * Also goes through proxy for consistency.
 * 
 * @param {Object} userProfile - User profile with skills, objective, etc.
 * @param {Object} preferences - Optional search preferences
 * @returns {Promise<Object>} - { success, count, jobs[] }
 */
export async function fetchMatchedJobs(userProfile, preferences = null) {
    try {
        const response = await fetch('/api/match-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_profile: userProfile,
                preferences: preferences,
                flat: true
            })
        });

        const data = await response.json();

        if (data.rateLimited) {
            return { success: false, rateLimited: true, message: data.message };
        }

        if (!response.ok) {
            throw new Error(data.detail || `API error: ${response.status}`);
        }

        return data;
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
