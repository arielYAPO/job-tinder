/**
 * Rate Limiting Helper
 * 
 * Reusable "bouncer" function for API routes.
 * Checks usage limits against the profiles table and auto-resets daily.
 * 
 * Usage:
 *   const { allowed, remaining, error } = await checkRateLimit(supabase, userId, 'emails', 5);
 *   if (!allowed) return NextResponse.json({ rateLimited: true, remaining: 0 });
 */

/**
 * Check and increment a usage limit for a user.
 * 
 * @param {Object} supabase - Supabase client (SSR, with auth context)
 * @param {string} userId - The user's auth UUID
 * @param {'searches' | 'emails'} limitType - Which counter to check
 * @param {number} maxPerDay - Maximum allowed per day (e.g. 3 or 5)
 * @returns {{ allowed: boolean, remaining: number, error?: string }}
 */
export async function checkRateLimit(supabase, userId, limitType, maxPerDay) {
    const columnName = limitType === 'searches' ? 'searches_used' : 'emails_used';
    const today = new Date().toISOString().split('T')[0]; // "2026-02-17"

    try {
        // 1. Read current usage
        const { data: profile, error: readError } = await supabase
            .from('profiles')
            .select(`${columnName}, last_reset_date`)
            .eq('user_id', userId)
            .single();

        if (readError || !profile) {
            console.error('Rate limit read error:', readError);
            return { allowed: true, remaining: maxPerDay, error: 'Profile not found, allowing request' };
        }

        // 2. Auto-reset if new day
        let currentUsage = profile[columnName] || 0;
        const isNewDay = profile.last_reset_date !== today;

        if (isNewDay) {
            // Reset BOTH counters on new day
            currentUsage = 0;
        }

        // 3. Check limit
        if (currentUsage >= maxPerDay) {
            return {
                allowed: false,
                remaining: 0
            };
        }

        // 4. Increment counter
        const updateData = {
            [columnName]: currentUsage + 1,
            last_reset_date: today
        };

        // If new day, also reset the OTHER counter
        if (isNewDay) {
            const otherColumn = limitType === 'searches' ? 'emails_used' : 'searches_used';
            updateData[otherColumn] = 0;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('user_id', userId);

        if (updateError) {
            console.error('Rate limit update error:', updateError);
            // Don't block the user if the counter fails to update
        }

        return {
            allowed: true,
            remaining: maxPerDay - (currentUsage + 1)
        };

    } catch (err) {
        console.error('Rate limit unexpected error:', err);
        return { allowed: true, remaining: maxPerDay, error: 'Rate limit check failed, allowing request' };
    }
}

/**
 * Get current usage for display purposes (no increment).
 * 
 * @param {Object} supabase - Supabase client
 * @param {string} userId - The user's auth UUID
 * @returns {{ searches: number, emails: number, maxSearches: number, maxEmails: number }}
 */
export async function getUsage(supabase, userId) {
    const today = new Date().toISOString().split('T')[0];

    const { data: profile } = await supabase
        .from('profiles')
        .select('searches_used, emails_used, last_reset_date')
        .eq('user_id', userId)
        .single();

    if (!profile) {
        return { searches: 0, emails: 0, maxSearches: 3, maxEmails: 5 };
    }

    // If new day, show 0 usage
    const isNewDay = profile.last_reset_date !== today;

    return {
        searches: isNewDay ? 0 : (profile.searches_used || 0),
        emails: isNewDay ? 0 : (profile.emails_used || 0),
        maxSearches: 3,
        maxEmails: 5
    };
}
