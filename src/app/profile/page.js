'use client'
import createClient from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe, Save, Briefcase, GraduationCap, Rocket, Award, Plus, Trash2, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ProfilePage() {
    // Basic profile states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [skills, setSkills] = useState('');
    const [languages, setLanguages] = useState('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [github, setGithub] = useState('');
    const [portfolio, setPortfolio] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Experiences states
    const [experiences, setExperiences] = useState([]);
    const [showExpForm, setShowExpForm] = useState(false);
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [isCurrent, setIsCurrent] = useState(false);

    // Education states
    const [education, setEducation] = useState([]);
    const [showEduForm, setShowEduForm] = useState(false);
    const [newDegree, setNewDegree] = useState('');
    const [newSchool, setNewSchool] = useState('');
    const [newField, setNewField] = useState('');
    const [newGradYear, setNewGradYear] = useState('');

    // Projects states
    const [projects, setProjects] = useState([]);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newProjectTech, setNewProjectTech] = useState('');
    const [newProjectUrl, setNewProjectUrl] = useState('');

    // Certifications states
    const [certifications, setCertifications] = useState([]);
    const [showCertForm, setShowCertForm] = useState(false);
    const [newCertName, setNewCertName] = useState('');
    const [newCertIssuer, setNewCertIssuer] = useState('');
    const [newCertDate, setNewCertDate] = useState('');

    useEffect(() => {
        loadAllData();
    }, []);

    async function loadAllData() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Load profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                setName(profile.full_name || '');
                setEmail(profile.email || '');
                setPhone(profile.phone || '');
                setSkills(profile.skills ? profile.skills.join(', ') : '');
                setLanguages(profile.languages ? profile.languages.join(', ') : '');
                setLocation(profile.location || '');
                setBio(profile.bio || '');
                setLinkedin(profile.linkedin_url || '');
                setGithub(profile.github_url || '');
                setPortfolio(profile.portfolio_url || '');
            }

            // Load experiences
            const { data: exp, error: expError } = await supabase
                .from('experiences')
                .select('*')
                .eq('user_id', user.id)
                .order('start_date', { ascending: false });

            console.log('Experiences loaded:', exp, 'Error:', expError);
            setExperiences(exp || []);

            // Load education
            const { data: edu, error: eduError } = await supabase
                .from('education')
                .select('*')
                .eq('user_id', user.id)
                .order('graduation_year', { ascending: false });

            console.log('Education loaded:', edu, 'Error:', eduError);
            setEducation(edu || []);

            // Load projects
            const { data: proj } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            setProjects(proj || []);

            // Load certifications
            const { data: certs } = await supabase
                .from('certifications')
                .select('*')
                .eq('user_id', user.id)
                .order('issue_date', { ascending: false });
            setCertifications(certs || []);
        }
        setLoading(false);
    }

    const handleSave = async () => {
        setMessage('');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
        const languagesArray = languages.split(',').map(l => l.trim()).filter(l => l);

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: name,
                email: email,
                phone: phone,
                skills: skillsArray,
                languages: languagesArray,
                location: location,
                bio: bio,
                linkedin_url: linkedin,
                github_url: github,
                portfolio_url: portfolio
            })
            .eq('user_id', user.id);

        if (error) {
            setMessage('Error saving profile');
        } else {
            setMessage('Profil enregistré !');
        }
    };

    // Experience handlers
    const handleAddExperience = async () => {
        if (!newJobTitle || !newCompany) {
            alert('Please fill in Job Title and Company');
            return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Format dates properly (month input gives "2025-01", DB needs "2025-01-01")
        const formattedStartDate = newStartDate ? `${newStartDate}-01` : null;
        const formattedEndDate = isCurrent ? null : (newEndDate ? `${newEndDate}-01` : null);

        const { error } = await supabase.from('experiences').insert({
            user_id: user.id,
            job_title: newJobTitle,
            company: newCompany,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            is_current: isCurrent,
            description: newDescription
        });

        if (error) {
            console.error('Error adding experience:', JSON.stringify(error, null, 2));
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error details:', error.details);
            alert('Error adding experience: ' + (error.message || 'Unknown error'));
            return;
        }

        // Clear form, hide it, and reload
        setNewJobTitle('');
        setNewCompany('');
        setNewStartDate('');
        setNewEndDate('');
        setNewDescription('');
        setIsCurrent(false);
        setShowExpForm(false);
        await loadAllData();
    };

    const handleDeleteExperience = async (id) => {
        const supabase = createClient();
        const { error } = await supabase.from('experiences').delete().eq('id', id);
        if (error) {
            console.error('Error deleting experience:', error);
        }
        await loadAllData();
    };

    // Education handlers
    const handleAddEducation = async () => {
        if (!newDegree || !newSchool) {
            alert('Please fill in Degree and School');
            return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('education').insert({
            user_id: user.id,
            degree: newDegree,
            school: newSchool,
            field_of_study: newField,
            graduation_year: newGradYear ? parseInt(newGradYear) : null
        });

        if (error) {
            console.error('Error adding education:', error);
            alert('Error adding education');
            return;
        }

        // Clear form, hide it, and reload
        setNewDegree('');
        setNewSchool('');
        setNewField('');
        setNewGradYear('');
        setShowEduForm(false);
        await loadAllData();
    };

    const handleDeleteEducation = async (id) => {
        const supabase = createClient();
        const { error } = await supabase.from('education').delete().eq('id', id);
        if (error) {
            console.error('Error deleting education:', error);
        }
        await loadAllData();
    };

    // Project handlers
    const handleAddProject = async () => {
        if (!newProjectTitle) {
            alert('Please enter a project title');
            return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const techArray = newProjectTech.split(',').map(t => t.trim()).filter(t => t);

        const { error } = await supabase.from('projects').insert({
            user_id: user.id,
            title: newProjectTitle,
            description: newProjectDesc,
            tech_stack: techArray,
            url: newProjectUrl
        });

        if (error) {
            console.error('Error adding project:', error);
            alert('Error adding project');
            return;
        }

        setNewProjectTitle('');
        setNewProjectDesc('');
        setNewProjectTech('');
        setNewProjectUrl('');
        setShowProjectForm(false);
        await loadAllData();
    };

    const handleDeleteProject = async (id) => {
        const supabase = createClient();
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
            console.error('Error deleting project:', error);
        }
        await loadAllData();
    };

    // Certification handlers
    const handleAddCertification = async () => {
        if (!newCertName) {
            alert('Please enter a certification name');
            return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('certifications').insert({
            user_id: user.id,
            name: newCertName,
            issuer: newCertIssuer,
            issue_date: newCertDate || null
        });

        if (error) {
            console.error('Error adding certification:', error);
            alert('Error adding certification');
            return;
        }

        setNewCertName('');
        setNewCertIssuer('');
        setNewCertDate('');
        setShowCertForm(false);
        await loadAllData();
    };

    const handleDeleteCertification = async (id) => {
        const supabase = createClient();
        const { error } = await supabase.from('certifications').delete().eq('id', id);
        if (error) {
            console.error('Error deleting certification:', error);
        }
        await loadAllData();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-haze flex items-center justify-center">
                <p className="text-[var(--foreground-muted)]">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-haze">
            <div className="max-w-lg mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-white">
                        Mon <span className="text-neon">Profil</span>
                    </h1>
                    <a href="/jobs" className="px-4 py-2 bg-[var(--primary)] text-black font-medium rounded-xl hover:glow-primary transition text-sm">
                        ← Retour
                    </a>
                </div>

                {/* Basic Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass gradient-border rounded-3xl p-8 mb-8 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--secondary)]/5 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="p-2 bg-[var(--primary)]/10 rounded-xl">
                                <User className="w-6 h-6 text-[var(--primary)]" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-wide">Infos de base</h2>
                        </div>

                        <div className="grid gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 ml-1">
                                    Nom complet
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-5 py-4 bg-[var(--surface-elevated)] border border-white/5 rounded-2xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                                    placeholder="Votre nom"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 ml-1">
                                    Compétences
                                </label>
                                <input
                                    type="text"
                                    value={skills}
                                    onChange={(e) => setSkills(e.target.value)}
                                    className="w-full px-5 py-4 bg-[var(--surface-elevated)] border border-white/5 rounded-2xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                                    placeholder="React, JavaScript, Python"
                                />
                                <p className="text-xs text-[var(--foreground-dim)] mt-2 ml-1">Séparer par des virgules</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 ml-1">
                                    Langues
                                </label>
                                <input
                                    type="text"
                                    value={languages}
                                    onChange={(e) => setLanguages(e.target.value)}
                                    className="w-full px-5 py-4 bg-[var(--surface-elevated)] border border-white/5 rounded-2xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                                    placeholder="French (Native), English (Fluent), Spanish (Basic)"
                                />
                                <p className="text-xs text-[var(--foreground-dim)] mt-2 ml-1">ex. Français (Natif), Anglais (C1)</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 ml-1">
                                    Localisation
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-dim)]" />
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full pl-12 pr-5 py-4 bg-[var(--surface-elevated)] border border-white/5 rounded-2xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                                        placeholder="Paris, France"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2 ml-1">
                                    Bio
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    className="w-full px-5 py-4 bg-[var(--surface-elevated)] border border-white/5 rounded-2xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none resize-none"
                                    placeholder="Parlez-nous de vous..."
                                />
                            </div>

                            {/* Contact Information */}
                            <div className="border-t border-white/5 pt-6 mt-2">
                                <div className="flex items-center gap-2 mb-4">
                                    <Mail className="w-4 h-4 text-[var(--secondary)]" />
                                    <p className="text-sm font-semibold text-[var(--foreground-muted)] tracking-wide">COORDONNÉES</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-[var(--foreground-dim)] mb-1.5 ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary)] transition-all outline-none"
                                                placeholder="you@email.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[var(--foreground-dim)] mb-1.5 ml-1">Téléphone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary)] transition-all outline-none"
                                                placeholder="+33 6 12 34 56 78"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="border-t border-white/5 pt-6 mt-2">
                                <div className="flex items-center gap-2 mb-4">
                                    <Globe className="w-4 h-4 text-[var(--accent)]" />
                                    <p className="text-sm font-semibold text-[var(--foreground-muted)] tracking-wide">LIENS SOCIAUX</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-[var(--foreground-dim)] mb-1.5 ml-1">LinkedIn URL</label>
                                        <div className="relative">
                                            <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                                            <input
                                                type="url"
                                                value={linkedin}
                                                onChange={(e) => setLinkedin(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all outline-none"
                                                placeholder="linkedin.com/in/yourname"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[var(--foreground-dim)] mb-1.5 ml-1">GitHub URL</label>
                                        <div className="relative">
                                            <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                                            <input
                                                type="url"
                                                value={github}
                                                onChange={(e) => setGithub(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all outline-none"
                                                placeholder="github.com/yourname"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[var(--foreground-dim)] mb-1.5 ml-1">Portfolio URL</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
                                            <input
                                                type="url"
                                                value={portfolio}
                                                onChange={(e) => setPortfolio(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all outline-none"
                                                placeholder="yourportfolio.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-2xl hover:glow-primary transition-all shadow-lg shadow-[var(--primary)]/20 mt-4 flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Enregistrer
                            </motion.button>

                            {message && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-center text-sm font-medium ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}
                                >
                                    {message}
                                </motion.p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Experience Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass gradient-border rounded-3xl p-8 mb-8 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--secondary)]/5 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="p-2 bg-[var(--primary)]/10 rounded-xl">
                                <Briefcase className="w-6 h-6 text-[var(--primary)]" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-wide">Expériences</h2>
                        </div>

                        {/* Existing experiences as cards */}
                        {experiences.length > 0 ? (
                            <div className="space-y-4 mb-6">
                                <AnimatePresence>
                                    {experiences.map(exp => (
                                        <motion.div
                                            key={exp.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-[var(--surface-elevated)] border border-white/5 rounded-2xl p-6 relative group hover:border-[var(--primary)]/30 transition-all"
                                        >
                                            <button
                                                onClick={() => handleDeleteExperience(exp.id)}
                                                className="absolute top-4 right-4 text-[var(--foreground-dim)] hover:text-red-400 transition opacity-0 group-hover:opacity-100 p-2 hover:bg-red-400/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="pr-10">
                                                <h3 className="font-bold text-white text-lg mb-1">{exp.job_title}</h3>
                                                <div className="flex items-center gap-2 text-[var(--primary)] text-sm font-medium mb-3">
                                                    <Briefcase className="w-4 h-4" />
                                                    {exp.company}
                                                </div>
                                                <p className="text-[var(--foreground-dim)] text-xs font-mono uppercase tracking-wider mb-3 bg-white/5 inline-block px-2 py-1 rounded-md">
                                                    {exp.start_date} → {exp.is_current ? 'Présent' : (exp.end_date || 'N/A')}
                                                </p>
                                                {exp.description && (
                                                    <p className="text-[var(--foreground-muted)] text-sm leading-relaxed border-l-2 border-white/10 pl-3">
                                                        {exp.description}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl mb-6">
                                <p className="text-[var(--foreground-dim)] text-sm">Aucune expérience ajoutée.</p>
                            </div>
                        )}

                        {/* Collapsible Add Form */}
                        <AnimatePresence>
                            {!showExpForm ? (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowExpForm(true)}
                                    className="w-full py-4 border-2 border-dashed border-white/10 text-[var(--foreground-muted)] rounded-2xl hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2 font-medium"
                                >
                                    <Plus className="w-5 h-5" />
                                    Ajouter une expérience
                                </motion.button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-[var(--surface-elevated)] border border-white/10 rounded-2xl p-6 space-y-4"
                                >
                                    <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                        <p className="text-white font-bold flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-[var(--primary)]" />
                                            Nouvelle expérience
                                        </p>
                                        <button
                                            onClick={() => setShowExpForm(false)}
                                            className="text-[var(--foreground-dim)] hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={newJobTitle}
                                            onChange={(e) => setNewJobTitle(e.target.value)}
                                            className="px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                            placeholder="Titre du poste *"
                                        />
                                        <input
                                            type="text"
                                            value={newCompany}
                                            onChange={(e) => setNewCompany(e.target.value)}
                                            className="px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                            placeholder="Entreprise *"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-[var(--foreground-dim)] mb-1 block">Date de début</label>
                                            <input
                                                type="month"
                                                value={newStartDate}
                                                onChange={(e) => setNewStartDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-[var(--primary)]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--foreground-dim)] mb-1 block">Date de fin</label>
                                            <input
                                                type="month"
                                                value={newEndDate}
                                                onChange={(e) => setNewEndDate(e.target.value)}
                                                disabled={isCurrent}
                                                className="w-full px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm disabled:opacity-30 outline-none focus:border-[var(--primary)]"
                                            />
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] cursor-pointer hover:text-white transition">
                                        <input
                                            type="checkbox"
                                            checked={isCurrent}
                                            onChange={(e) => setIsCurrent(e.target.checked)}
                                            className="rounded border-white/20 bg-white/5 text-[var(--primary)] focus:ring-0 w-4 h-4"
                                        />
                                        Poste actuel
                                    </label>
                                    <textarea
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] resize-none outline-none focus:border-[var(--primary)]"
                                        placeholder="Décrivez votre rôle..."
                                    />
                                    <button
                                        onClick={handleAddExperience}
                                        className="w-full py-3 bg-[var(--primary)] text-black font-bold rounded-xl hover:glow-primary transition active:scale-[0.98]"
                                    >
                                        Enregistrer
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Education Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass gradient-border rounded-3xl p-8 mb-8 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--secondary)]/5 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="p-2 bg-[var(--primary)]/10 rounded-xl">
                                <GraduationCap className="w-6 h-6 text-[var(--primary)]" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-wide">Formation</h2>
                        </div>

                        {/* Existing education as cards */}
                        {education.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <AnimatePresence>
                                    {education.map(edu => (
                                        <motion.div
                                            key={edu.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-[var(--surface-elevated)] border border-white/5 rounded-2xl p-6 relative group hover:border-[var(--primary)]/30 transition-all flex flex-col justify-between"
                                        >
                                            <button
                                                onClick={() => handleDeleteEducation(edu.id)}
                                                className="absolute top-4 right-4 text-[var(--foreground-dim)] hover:text-red-400 transition opacity-0 group-hover:opacity-100 p-2 hover:bg-red-400/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div>
                                                <h3 className="font-bold text-white text-lg mb-1 pr-8">{edu.degree}</h3>
                                                <p className="text-[var(--primary)] text-sm font-medium mb-3">{edu.school}</p>
                                                {edu.field_of_study && (
                                                    <div className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs text-[var(--foreground-muted)] mb-3">
                                                        {edu.field_of_study}
                                                    </div>
                                                )}
                                            </div>

                                            {edu.graduation_year && (
                                                <div className="text-[var(--foreground-dim)] text-xs font-mono border-t border-white/5 pt-3 mt-2 flex items-center gap-2">
                                                    <Award className="w-3 h-3" />
                                                    Class of {edu.graduation_year}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl mb-6">
                                <p className="text-[var(--foreground-dim)] text-sm">No education added yet.</p>
                            </div>
                        )}

                        {/* Collapsible Add Form */}
                        <AnimatePresence>
                            {!showEduForm ? (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowEduForm(true)}
                                    className="w-full py-4 border-2 border-dashed border-white/10 text-[var(--foreground-muted)] rounded-2xl hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2 font-medium"
                                >
                                    <Plus className="w-5 h-5" />
                                    Ajouter une formation
                                </motion.button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-[var(--surface-elevated)] border border-white/10 rounded-2xl p-6 space-y-4"
                                >
                                    <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                        <p className="text-white font-bold flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-[var(--primary)]" />
                                            Nouvelle formation
                                        </p>
                                        <button
                                            onClick={() => setShowEduForm(false)}
                                            className="text-[var(--foreground-dim)] hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={newDegree}
                                            onChange={(e) => setNewDegree(e.target.value)}
                                            className="px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                            placeholder="Degree *"
                                        />
                                        <input
                                            type="text"
                                            value={newSchool}
                                            onChange={(e) => setNewSchool(e.target.value)}
                                            className="px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                            placeholder="School *"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={newField}
                                            onChange={(e) => setNewField(e.target.value)}
                                            className="px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                            placeholder="Field of Study"
                                        />
                                        <input
                                            type="number"
                                            value={newGradYear}
                                            onChange={(e) => setNewGradYear(e.target.value)}
                                            className="px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                            placeholder="Grad Year (e.g. 2025)"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddEducation}
                                        className="w-full py-3 bg-[var(--primary)] text-black font-bold rounded-xl hover:glow-primary transition active:scale-[0.98]"
                                    >
                                        Enregistrer
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Projects Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass gradient-border rounded-3xl p-8 mb-8 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--secondary)]/5 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="p-2 bg-[var(--primary)]/10 rounded-xl">
                                <Rocket className="w-6 h-6 text-[var(--primary)]" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-wide">Projets</h2>
                        </div>

                        {projects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <AnimatePresence>
                                    {projects.map(proj => (
                                        <motion.div
                                            key={proj.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-[var(--surface-elevated)] border border-white/5 rounded-2xl p-6 relative group hover:border-[var(--primary)]/30 transition-all flex flex-col justify-between"
                                        >
                                            <button
                                                onClick={() => handleDeleteProject(proj.id)}
                                                className="absolute top-4 right-4 text-[var(--foreground-dim)] hover:text-red-400 transition opacity-0 group-hover:opacity-100 p-2 hover:bg-red-400/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div>
                                                <h3 className="font-bold text-white text-lg mb-2 pr-8">{proj.title}</h3>
                                                {proj.description && (
                                                    <p className="text-[var(--foreground-muted)] text-sm mb-4 line-clamp-3 leading-relaxed">
                                                        {proj.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-3 mt-2">
                                                {proj.tech_stack && proj.tech_stack.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {proj.tech_stack.slice(0, 3).map((tech, i) => (
                                                            <span key={i} className="text-[10px] uppercase font-bold text-[var(--foreground-dim)] bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                                                {tech}
                                                            </span>
                                                        ))}
                                                        {proj.tech_stack.length > 3 && (
                                                            <span className="text-[10px] uppercase font-bold text-[var(--foreground-dim)] bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                                                +{proj.tech_stack.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {proj.url && (
                                                    <a href={proj.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[var(--primary)] hover:underline pt-2 border-t border-white/5">
                                                        <Globe className="w-3 h-3" />
                                                        {proj.url.replace(/^https?:\/\//, '')}
                                                    </a>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl mb-6">
                                <p className="text-[var(--foreground-dim)] text-sm">No projects added yet</p>
                            </div>
                        )}

                        <AnimatePresence>
                            {!showProjectForm ? (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowProjectForm(true)}
                                    className="w-full py-4 border-2 border-dashed border-white/10 text-[var(--foreground-muted)] rounded-2xl hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2 font-medium"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Project
                                </motion.button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-[var(--surface-elevated)] border border-white/10 rounded-2xl p-6 space-y-4"
                                >
                                    <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                        <p className="text-white font-bold flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-[var(--primary)]" />
                                            New Project
                                        </p>
                                        <button
                                            onClick={() => setShowProjectForm(false)}
                                            className="text-[var(--foreground-dim)] hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={newProjectTitle}
                                        onChange={(e) => setNewProjectTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                        placeholder="Project Title *"
                                    />
                                    <textarea
                                        value={newProjectDesc}
                                        onChange={(e) => setNewProjectDesc(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] resize-none outline-none focus:border-[var(--primary)]"
                                        placeholder="Brief description..."
                                    />
                                    <input
                                        type="text"
                                        value={newProjectTech}
                                        onChange={(e) => setNewProjectTech(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                        placeholder="Tech Stack (comma separated): React, Node.js, MongoDB"
                                    />
                                    <input
                                        type="url"
                                        value={newProjectUrl}
                                        onChange={(e) => setNewProjectUrl(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                        placeholder="Project URL (optional)"
                                    />
                                    <button
                                        onClick={handleAddProject}
                                        className="w-full py-3 bg-[var(--primary)] text-black font-bold rounded-xl hover:glow-primary transition active:scale-[0.98]"
                                    >
                                        Save Project
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Certifications Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass gradient-border rounded-3xl p-8 mb-8 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--secondary)]/5 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="p-2 bg-[var(--primary)]/10 rounded-xl">
                                <Award className="w-6 h-6 text-[var(--primary)]" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-wide">Certifications</h2>
                        </div>

                        {certifications.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <AnimatePresence>
                                    {certifications.map(cert => (
                                        <motion.div
                                            key={cert.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-[var(--surface-elevated)] border border-white/5 rounded-2xl p-6 relative group hover:border-[var(--primary)]/30 transition-all flex flex-col justify-between"
                                        >
                                            <button
                                                onClick={() => handleDeleteCertification(cert.id)}
                                                className="absolute top-4 right-4 text-[var(--foreground-dim)] hover:text-red-400 transition opacity-0 group-hover:opacity-100 p-2 hover:bg-red-400/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div>
                                                <h3 className="font-bold text-white text-lg mb-1 pr-8">{cert.name}</h3>
                                                {cert.issuer && (
                                                    <p className="text-[var(--primary)] text-sm font-medium mb-3">{cert.issuer}</p>
                                                )}
                                                {cert.issue_date && (
                                                    <p className="text-[var(--foreground-dim)] text-xs font-mono uppercase tracking-wider bg-white/5 inline-block px-2 py-1 rounded-md">
                                                        Issued: {new Date(cert.issue_date).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl mb-6">
                                <p className="text-[var(--foreground-dim)] text-sm">No certifications added yet</p>
                            </div>
                        )}

                        <AnimatePresence>
                            {!showCertForm ? (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowCertForm(true)}
                                    className="w-full py-4 border-2 border-dashed border-white/10 text-[var(--foreground-muted)] rounded-2xl hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2 font-medium"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Certification
                                </motion.button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-[var(--surface-elevated)] border border-white/10 rounded-2xl p-6 space-y-4"
                                >
                                    <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                        <p className="text-white font-bold flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-[var(--primary)]" />
                                            New Certification
                                        </p>
                                        <button
                                            onClick={() => setShowCertForm(false)}
                                            className="text-[var(--foreground-dim)] hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={newCertName}
                                        onChange={(e) => setNewCertName(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                        placeholder="Certification Name *"
                                    />
                                    <input
                                        type="text"
                                        value={newCertIssuer}
                                        onChange={(e) => setNewCertIssuer(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] outline-none"
                                        placeholder="Issuing Organization (AWS, Google, etc.)"
                                    />
                                    <input
                                        type="date"
                                        value={newCertDate}
                                        onChange={(e) => setNewCertDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--surface)] border border-white/5 rounded-xl text-white text-sm focus:border-[var(--primary)] outline-none"
                                    />
                                    <button
                                        onClick={handleAddCertification}
                                        className="w-full py-3 bg-[var(--primary)] text-black font-bold rounded-xl hover:glow-primary transition active:scale-[0.98]"
                                    >
                                        Save Certification
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default ProfilePage;
