/**
 * Calculate profile completeness score (0-100)
 * Used to determine if user should see onboarding prompts
 */
export function calculateProfileStrength(profile, experiences = [], education = []) {
    let score = 0;

    // Basic info (45%)
    if (profile?.full_name?.trim()) score += 15;
    if (profile?.skills?.length >= 3) score += 20;
    else if (profile?.skills?.length >= 1) score += 10;
    if (profile?.bio?.trim()) score += 10;

    // Contact info (20%)
    if (profile?.email?.trim()) score += 10;
    if (profile?.phone?.trim()) score += 5;
    if (profile?.location?.trim()) score += 5;

    // Experience & Education (35%)
    if (experiences?.length > 0) score += 20;
    if (education?.length > 0) score += 15;

    return Math.min(score, 100);
}

/**
 * Get missing profile items for display
 */
export function getMissingItems(profile, experiences = [], education = []) {
    const missing = [];

    if (!profile?.full_name?.trim()) missing.push('Full Name');
    if (!profile?.skills || profile.skills.length < 3) missing.push('Skills (at least 3)');
    if (!profile?.bio?.trim()) missing.push('Bio');
    if (!profile?.email?.trim()) missing.push('Email');
    if (experiences?.length === 0) missing.push('Work Experience');
    if (education?.length === 0) missing.push('Education');

    return missing;
}

/**
 * Check if profile is ready for CV generation
 */
export function isProfileReady(profile, experiences = [], education = []) {
    return calculateProfileStrength(profile, experiences, education) >= 70;
}
