'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import createClient from '@/lib/supabase/client';

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children, initialData = {} }) {
    // Validate and clamp step to valid range (0-5)
    const validateStep = (stepValue) => {
        const step = parseInt(stepValue, 10);
        if (isNaN(step) || step < 0) return 0;
        if (step > 5) return 5; // Max step is 5 (complete)
        return step;
    };

    const [step, setStep] = useState(validateStep(initialData.onboarding_step));
    const [goalType, setGoalType] = useState(initialData.goal_type || null);
    const [preferences, setPreferences] = useState(initialData.job_preferences || {});
    const [hasLikedJob, setHasLikedJob] = useState(initialData.has_liked_job || false);
    const [hasGeneratedCV, setHasGeneratedCV] = useState(initialData.has_generated_cv || false);
    const [isComplete, setIsComplete] = useState(validateStep(initialData.onboarding_step) >= 5);

    const supabase = createClient();

    // Sync state to database
    const syncToDatabase = useCallback(async (updates) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', user.id);
    }, [supabase]);

    // Step navigation
    const nextStep = useCallback(async () => {
        const newStep = Math.min(5, step + 1); // Never exceed 5
        setStep(newStep);
        await syncToDatabase({ onboarding_step: newStep });
    }, [step, syncToDatabase]);

    const prevStep = useCallback(async () => {
        const newStep = Math.max(0, step - 1);
        setStep(newStep);
        await syncToDatabase({ onboarding_step: newStep });
    }, [step, syncToDatabase]);

    const goToStep = useCallback(async (targetStep) => {
        const validStep = Math.max(0, Math.min(5, targetStep)); // Clamp to 0-5
        setStep(validStep);
        await syncToDatabase({ onboarding_step: validStep });
    }, [syncToDatabase]);

    // Goal type
    const updateGoalType = useCallback(async (type) => {
        setGoalType(type);
        await syncToDatabase({ goal_type: type });
    }, [syncToDatabase]);

    // Preferences
    const updatePreferences = useCallback(async (newPrefs) => {
        const merged = { ...preferences, ...newPrefs };
        setPreferences(merged);
        await syncToDatabase({ job_preferences: merged });
    }, [preferences, syncToDatabase]);

    // First like tracking
    const markFirstLike = useCallback(async () => {
        if (!hasLikedJob) {
            setHasLikedJob(true);
            await syncToDatabase({ has_liked_job: true });
        }
    }, [hasLikedJob, syncToDatabase]);

    // CV generation tracking
    const markCVGenerated = useCallback(async () => {
        if (!hasGeneratedCV) {
            setHasGeneratedCV(true);
            await syncToDatabase({ has_generated_cv: true });
        }
    }, [hasGeneratedCV, syncToDatabase]);

    // Complete onboarding
    const completeOnboarding = useCallback(async () => {
        setIsComplete(true);
        setStep(5); // Keep as number, 5 = complete (final step done)
        await syncToDatabase({ onboarding_step: 5 }); // 5 = complete
    }, [syncToDatabase]);

    // Checklist status
    const checklistStatus = {
        profileComplete: false, // Will be calculated by consumer
        hasLikedJob,
        hasGeneratedCV,
        isComplete
    };

    const value = {
        // State
        step,
        goalType,
        preferences,
        hasLikedJob,
        hasGeneratedCV,
        isComplete,
        checklistStatus,

        // Actions
        nextStep,
        prevStep,
        goToStep,
        updateGoalType,
        updatePreferences,
        markFirstLike,
        markCVGenerated,
        completeOnboarding,
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}

export default OnboardingContext;
