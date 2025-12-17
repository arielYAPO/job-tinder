'use client'
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import createClient from '@/lib/supabase/client';
import {
    User, Mail, MapPin, Code, GraduationCap, Languages,
    Briefcase, Rocket, Github, Linkedin, ChevronLeft, ArrowRight,
    CheckCircle2, Circle, Plus, X, Sparkles
} from 'lucide-react';

export default function StepProfile({ onNext, onBack, profile: initialProfile, experiences: initialExp, education: initialEdu, projects: initialProjects }) {
    const { goalType } = useOnboarding();
    const supabase = createClient();

    // Profile state
    const [fullName, setFullName] = useState(initialProfile?.full_name || '');
    const [email, setEmail] = useState(initialProfile?.email || '');
    const [location, setLocation] = useState(initialProfile?.location || '');
    const [skills, setSkills] = useState(initialProfile?.skills?.join(', ') || '');
    const [languages, setLanguages] = useState(initialProfile?.languages?.join(', ') || '');
    const [linkedin, setLinkedin] = useState(initialProfile?.linkedin_url || '');
    const [github, setGithub] = useState(initialProfile?.github_url || '');

    // Lists
    const [educationList, setEducationList] = useState(initialEdu || []);
    const [projectsList, setProjectsList] = useState(initialProjects || []);
    const [experiencesList, setExperiencesList] = useState(initialExp || []);

    // UI state
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeSection, setActiveSection] = useState('basic');

    // Quick add forms
    const [showEduForm, setShowEduForm] = useState(false);
    const [newDegree, setNewDegree] = useState('');
    const [newSchool, setNewSchool] = useState('');

    const [showProjectForm, setShowProjectForm] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

    // Validation
    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
    const languagesArray = languages.split(',').map(l => l.trim()).filter(l => l);

    const validation = {
        fullName: fullName.trim().length > 0,
        email: email.trim().length > 0 && email.includes('@'),
        location: location.trim().length > 0,
        skills: skillsArray.length >= 3,
        education: educationList.length > 0,
        languages: languagesArray.length > 0,
        // Recommended for alternance
        projects: projectsList.length > 0,
        socialLink: linkedin.trim().length > 0 || github.trim().length > 0
    };

    // Required fields check
    const requiredFieldsComplete = validation.fullName && validation.email && validation.location &&
        validation.skills && validation.education && validation.languages;

    // Profile strength calculation
    const calculateStrength = () => {
        let score = 0;
        if (validation.fullName) score += 15;
        if (validation.email) score += 10;
        if (validation.location) score += 10;
        if (validation.skills) score += 20;
        if (validation.education) score += 15;
        if (validation.languages) score += 10;
        if (validation.projects) score += 10;
        if (validation.socialLink) score += 5;
        if (experiencesList.length > 0) score += 5;
        return Math.min(score, 100);
    };

    const profileStrength = calculateStrength();

    // Save profile
    const handleSave = async () => {
        if (!requiredFieldsComplete) return;

        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('profiles').update({
            full_name: fullName,
            email: email,
            location: location,
            skills: skillsArray,
            languages: languagesArray,
            linkedin_url: linkedin,
            github_url: github
        }).eq('user_id', user.id);

        setSaving(false);
        setShowSuccess(true);
    };

    // Add education quick
    const handleAddEducation = async () => {
        if (!newDegree || !newSchool) return;
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase.from('education').insert({
            user_id: user.id,
            degree: newDegree,
            school: newSchool
        }).select().single();

        if (!error && data) {
            setEducationList([...educationList, data]);
            setNewDegree('');
            setNewSchool('');
            setShowEduForm(false);
        }
    };

    // Add project quick
    const handleAddProject = async () => {
        if (!newProjectTitle) return;
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase.from('projects').insert({
            user_id: user.id,
            title: newProjectTitle,
            description: newProjectDesc
        }).select().single();

        if (!error && data) {
            setProjectsList([...projectsList, data]);
            setNewProjectTitle('');
            setNewProjectDesc('');
            setShowProjectForm(false);
        }
    };

    // Success screen
    if (showSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass gradient-border rounded-3xl p-8 md:p-10 text-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-[var(--primary)]/10 pointer-events-none" />

                <div className="relative z-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full mb-6"
                    >
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </motion.div>

                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-bold text-white mb-2"
                    >
                        Profile ready! 🎉
                    </motion.h2>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-[var(--foreground-muted)] mb-2"
                    >
                        Your profile strength: <span className="text-[var(--primary)] font-bold">{profileStrength}%</span>
                    </motion.p>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-[var(--foreground-dim)] text-sm mb-8"
                    >
                        Next: learn how to swipe jobs!
                    </motion.p>

                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onNext}
                        className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-2xl hover:glow-primary transition-all flex items-center justify-center gap-2"
                    >
                        Start swiping
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="glass gradient-border rounded-3xl p-6 md:p-8 relative overflow-hidden max-h-[80vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10 pointer-events-none" />

            <div className="relative z-10">
                {/* Header with strength meter */}
                <div className="mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                        Build your profile
                    </h2>
                    <p className="text-sm text-[var(--foreground-muted)] mb-4">
                        The stronger your profile, the stronger your CV.
                    </p>

                    {/* Strength meter */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${profileStrength}%` }}
                                transition={{ duration: 0.5 }}
                                className={`h-full rounded-full ${profileStrength >= 80 ? 'bg-emerald-500' :
                                    profileStrength >= 50 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                    }`}
                            />
                        </div>
                        <span className={`text-sm font-bold ${profileStrength >= 80 ? 'text-emerald-400' :
                            profileStrength >= 50 ? 'text-yellow-400' :
                                'text-red-400'
                            }`}>
                            {profileStrength}%
                        </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-dim)]">
                        ✨ Tip: Fill like you can — AI reformulates for you.
                    </p>
                </div>

                {/* Required Fields */}
                <div className="space-y-4 mb-6">
                    <div className="text-xs font-semibold text-[var(--foreground-dim)] uppercase tracking-wider flex items-center gap-2">
                        <span className="text-red-400">*</span> Required fields
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-xs text-[var(--foreground-muted)] mb-1.5 ml-1 flex items-center gap-2">
                            Full Name
                            {validation.fullName ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-[var(--foreground-dim)]" />}
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your full name"
                                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs text-[var(--foreground-muted)] mb-1.5 ml-1 flex items-center gap-2">
                            Email
                            {validation.email ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-[var(--foreground-dim)]" />}
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@email.com"
                                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-xs text-[var(--foreground-muted)] mb-1.5 ml-1 flex items-center gap-2">
                            Location
                            {validation.location ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-[var(--foreground-dim)]" />}
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Paris, France"
                                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                            />
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-xs text-[var(--foreground-muted)] mb-1.5 ml-1 flex items-center gap-2">
                            Skills (min 3)
                            {validation.skills ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-[var(--foreground-dim)]" />}
                            <span className="text-[var(--foreground-dim)]">({skillsArray.length}/3+)</span>
                        </label>
                        <div className="relative">
                            <Code className="absolute left-3 top-3 w-4 h-4 text-[var(--foreground-dim)]" />
                            <textarea
                                value={skills}
                                onChange={(e) => setSkills(e.target.value)}
                                placeholder="React, JavaScript, Python, Node.js, SQL..."
                                rows={2}
                                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none resize-none"
                            />
                        </div>
                        <p className="text-xs text-[var(--foreground-dim)] mt-1 ml-1">Separate with commas</p>
                    </div>

                    {/* Languages */}
                    <div>
                        <label className="block text-xs text-[var(--foreground-muted)] mb-1.5 ml-1 flex items-center gap-2">
                            Languages
                            {validation.languages ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-[var(--foreground-dim)]" />}
                        </label>
                        <div className="relative">
                            <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                            <input
                                type="text"
                                value={languages}
                                onChange={(e) => setLanguages(e.target.value)}
                                placeholder="French (Native), English (C1)"
                                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                            />
                        </div>
                    </div>

                    {/* Education */}
                    <div>
                        <label className="block text-xs text-[var(--foreground-muted)] mb-1.5 ml-1 flex items-center gap-2">
                            Education (at least 1)
                            {validation.education ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-[var(--foreground-dim)]" />}
                        </label>

                        {educationList.length > 0 && (
                            <div className="space-y-2 mb-2">
                                {educationList.map(edu => (
                                    <div key={edu.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg text-sm">
                                        <GraduationCap className="w-4 h-4 text-[var(--primary)]" />
                                        <span className="text-white flex-1">{edu.degree}</span>
                                        <span className="text-[var(--foreground-dim)]">{edu.school}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <AnimatePresence>
                            {showEduForm ? (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-white/5 rounded-xl p-3 space-y-2"
                                >
                                    <input
                                        type="text"
                                        value={newDegree}
                                        onChange={(e) => setNewDegree(e.target.value)}
                                        placeholder="Degree (e.g. Master in Computer Science)"
                                        className="w-full px-3 py-2 bg-[var(--surface)] border border-white/5 rounded-lg text-white text-sm placeholder-[var(--foreground-dim)] outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={newSchool}
                                        onChange={(e) => setNewSchool(e.target.value)}
                                        placeholder="School / University"
                                        className="w-full px-3 py-2 bg-[var(--surface)] border border-white/5 rounded-lg text-white text-sm placeholder-[var(--foreground-dim)] outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowEduForm(false)}
                                            className="px-3 py-2 text-[var(--foreground-dim)] text-sm hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddEducation}
                                            className="flex-1 py-2 bg-[var(--primary)] text-black text-sm font-medium rounded-lg"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <button
                                    onClick={() => setShowEduForm(true)}
                                    className="w-full py-2.5 border border-dashed border-white/20 rounded-xl text-[var(--foreground-muted)] text-sm hover:border-[var(--primary)] hover:text-[var(--primary)] transition flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add education
                                </button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Recommended Fields */}
                <div className="space-y-4 mb-6 pt-4 border-t border-white/5">
                    <div className="text-xs font-semibold text-[var(--foreground-dim)] uppercase tracking-wider">
                        Recommended {goalType === 'apprenticeship' && <span className="text-yellow-400">(important for alternance)</span>}
                    </div>

                    {/* Projects */}
                    <div>
                        <label className="block text-xs text-[var(--foreground-muted)] mb-1.5 ml-1 flex items-center gap-2">
                            Projects
                            {validation.projects ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-yellow-400" />}
                            {goalType === 'apprenticeship' && !validation.projects && (
                                <span className="text-xs text-yellow-400">No experience? Add 1-2 projects!</span>
                            )}
                        </label>

                        {projectsList.length > 0 && (
                            <div className="space-y-2 mb-2">
                                {projectsList.map(proj => (
                                    <div key={proj.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg text-sm">
                                        <Rocket className="w-4 h-4 text-[var(--secondary)]" />
                                        <span className="text-white">{proj.title}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <AnimatePresence>
                            {showProjectForm ? (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-white/5 rounded-xl p-3 space-y-2"
                                >
                                    <input
                                        type="text"
                                        value={newProjectTitle}
                                        onChange={(e) => setNewProjectTitle(e.target.value)}
                                        placeholder="Project name"
                                        className="w-full px-3 py-2 bg-[var(--surface)] border border-white/5 rounded-lg text-white text-sm placeholder-[var(--foreground-dim)] outline-none"
                                    />
                                    <textarea
                                        value={newProjectDesc}
                                        onChange={(e) => setNewProjectDesc(e.target.value)}
                                        placeholder="Brief description (optional)"
                                        rows={2}
                                        className="w-full px-3 py-2 bg-[var(--surface)] border border-white/5 rounded-lg text-white text-sm placeholder-[var(--foreground-dim)] outline-none resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowProjectForm(false)}
                                            className="px-3 py-2 text-[var(--foreground-dim)] text-sm hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddProject}
                                            className="flex-1 py-2 bg-[var(--secondary)] text-white text-sm font-medium rounded-lg"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <button
                                    onClick={() => setShowProjectForm(true)}
                                    className="w-full py-2.5 border border-dashed border-white/20 rounded-xl text-[var(--foreground-muted)] text-sm hover:border-[var(--secondary)] hover:text-[var(--secondary)] transition flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add project
                                </button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Social Links */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-[var(--foreground-dim)] mb-1.5 ml-1">LinkedIn</label>
                            <div className="relative">
                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                                <input
                                    type="url"
                                    value={linkedin}
                                    onChange={(e) => setLinkedin(e.target.value)}
                                    placeholder="linkedin.com/in/..."
                                    className="w-full pl-10 pr-3 py-2.5 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--foreground-dim)] mb-1.5 ml-1">GitHub</label>
                            <div className="relative">
                                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                                <input
                                    type="url"
                                    value={github}
                                    onChange={(e) => setGithub(e.target.value)}
                                    placeholder="github.com/..."
                                    className="w-full pl-10 pr-3 py-2.5 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onBack}
                        className="px-5 py-3.5 bg-white/5 border border-white/10 text-[var(--foreground-muted)] font-medium rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!requiredFieldsComplete || saving}
                        className={`flex-1 py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${requiredFieldsComplete && !saving
                            ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white hover:glow-primary'
                            : 'bg-white/10 text-[var(--foreground-dim)] cursor-not-allowed'
                            }`}
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                Save & Continue
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>

                {!requiredFieldsComplete && (
                    <p className="text-xs text-center text-[var(--foreground-dim)] mt-3">
                        Complete all required fields to continue
                    </p>
                )}
            </div>
        </div>
    );
}
