'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, User, Briefcase, GraduationCap, FolderKanban, Code, Plus, Trash2, Check, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import createClient from '@/lib/supabase/client';

export default function CVBuilderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [activeSection, setActiveSection] = useState('contact');
    const [userId, setUserId] = useState(null);

    // Profile data
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        github_url: '',
        portfolio_url: '',
        location: '',
        headline: '',
        bio: '',
        experiences: [],
        education: [],
        projects: [],
        skills: [],
    });

    // Fetch profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Get current user
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                setUserId(user.id);

                const res = await fetch(`/api/cv-profile?user_id=${user.id}`);
                const data = await res.json();
                if (data.success && data.profile) {
                    setProfile({
                        full_name: data.profile.full_name || '',
                        email: data.profile.email || '',
                        phone: data.profile.phone || '',
                        linkedin_url: data.profile.linkedin_url || '',
                        github_url: data.profile.github_url || '',
                        portfolio_url: data.profile.portfolio_url || '',
                        location: data.profile.location || '',
                        headline: data.profile.headline || '',
                        bio: data.profile.bio || '',
                        experiences: data.profile.experiences || [],
                        education: data.profile.education || [],
                        projects: data.profile.projects || [],
                        skills: data.profile.skills || [],
                    });
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    // Save profile
    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            const res = await fetch('/api/cv-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...profile, user_id: userId }),
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } else {
                alert('Erreur: ' + (data.error || 'Inconnue'));
            }
        } catch (err) {
            console.error('Error saving profile:', err);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    // Download PDF
    const handleDownload = async () => {
        if (!userId) {
            alert('Connecte-toi d\'abord');
            return;
        }

        // Save first to ensure latest data
        await handleSave();

        setDownloading(true);
        try {
            const res = await fetch('http://localhost:8000/generate-cv-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });

            const data = await res.json();

            if (data.success && data.pdf_base64) {
                // Convert base64 to blob and download
                const byteCharacters = atob(data.pdf_base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });

                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = data.filename || 'cv.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Erreur: ' + (data.detail || 'Génération échouée'));
            }
        } catch (err) {
            console.error('Error downloading CV:', err);
            alert('Erreur lors du téléchargement');
        } finally {
            setDownloading(false);
        }
    };

    // Update field helper
    const updateField = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    // Experience helpers
    const addExperience = () => {
        setProfile(prev => ({
            ...prev,
            experiences: [...prev.experiences, { company: '', title: '', start_date: '', end_date: '', current: false, description: '' }]
        }));
    };

    const updateExperience = (index, field, value) => {
        setProfile(prev => ({
            ...prev,
            experiences: prev.experiences.map((exp, i) => i === index ? { ...exp, [field]: value } : exp)
        }));
    };

    const removeExperience = (index) => {
        setProfile(prev => ({
            ...prev,
            experiences: prev.experiences.filter((_, i) => i !== index)
        }));
    };

    // Education helpers
    const addEducation = () => {
        setProfile(prev => ({
            ...prev,
            education: [...prev.education, { school: '', degree: '', field: '', start_year: '', end_year: '' }]
        }));
    };

    const updateEducation = (index, field, value) => {
        setProfile(prev => ({
            ...prev,
            education: prev.education.map((edu, i) => i === index ? { ...edu, [field]: value } : edu)
        }));
    };

    const removeEducation = (index) => {
        setProfile(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }));
    };

    // Project helpers
    const addProject = () => {
        setProfile(prev => ({
            ...prev,
            projects: [...prev.projects, { name: '', description: '', url: '', skills: '' }]
        }));
    };

    const updateProject = (index, field, value) => {
        setProfile(prev => ({
            ...prev,
            projects: prev.projects.map((proj, i) => i === index ? { ...proj, [field]: value } : proj)
        }));
    };

    const removeProject = (index) => {
        setProfile(prev => ({
            ...prev,
            projects: prev.projects.filter((_, i) => i !== index)
        }));
    };

    const sections = [
        { id: 'contact', label: 'Contact', icon: User },
        { id: 'experiences', label: 'Expériences', icon: Briefcase },
        { id: 'education', label: 'Formation', icon: GraduationCap },
        { id: 'projects', label: 'Projets', icon: FolderKanban },
        { id: 'skills', label: 'Compétences', icon: Code },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-white/5">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button onClick={() => router.push('/stationf')} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Retour</span>
                    </button>
                    <h1 className="text-lg font-bold">CV Builder</h1>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${saved
                            ? 'bg-emerald-500 text-white'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                            } disabled:opacity-50`}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Sauvegardé !' : 'Sauvegarder'}
                    </button>

                    {/* Download PDF Button */}
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {downloading ? 'Génération...' : 'Télécharger PDF'}
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <nav className="w-48 flex-shrink-0">
                        <div className="sticky top-24 space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === section.id
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <section.icon className="w-4 h-4" />
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Content */}
                    <main className="flex-1 min-w-0">
                        {/* Contact Section */}
                        {activeSection === 'contact' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <User className="w-5 h-5 text-purple-400" />
                                    Informations de contact
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Nom complet" value={profile.full_name} onChange={(v) => updateField('full_name', v)} placeholder="Jean Dupont" />
                                    <Input label="Email" value={profile.email} onChange={(v) => updateField('email', v)} placeholder="jean@example.com" />
                                    <Input label="Téléphone" value={profile.phone} onChange={(v) => updateField('phone', v)} placeholder="+33 6 12 34 56 78" />
                                    <Input label="Localisation" value={profile.location} onChange={(v) => updateField('location', v)} placeholder="Paris, France" />
                                    <Input label="LinkedIn" value={profile.linkedin_url} onChange={(v) => updateField('linkedin_url', v)} placeholder="linkedin.com/in/..." className="col-span-2" />
                                    <Input label="GitHub" value={profile.github_url} onChange={(v) => updateField('github_url', v)} placeholder="github.com/..." />
                                    <Input label="Portfolio" value={profile.portfolio_url} onChange={(v) => updateField('portfolio_url', v)} placeholder="monsite.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Headline (accroche)</label>
                                    <input
                                        type="text"
                                        value={profile.headline}
                                        onChange={(e) => updateField('headline', e.target.value)}
                                        placeholder="Développeur Fullstack | Passionné par l'IA"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Bio / Résumé</label>
                                    <textarea
                                        value={profile.bio}
                                        onChange={(e) => updateField('bio', e.target.value)}
                                        placeholder="2-3 phrases sur toi, ton parcours, tes ambitions..."
                                        rows={4}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Experiences Section */}
                        {activeSection === 'experiences' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-blue-400" />
                                        Expériences
                                    </h2>
                                    <button onClick={addExperience} className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors">
                                        <Plus className="w-4 h-4" /> Ajouter
                                    </button>
                                </div>
                                {profile.experiences.length === 0 ? (
                                    <p className="text-white/40 text-center py-8">Aucune expérience ajoutée</p>
                                ) : (
                                    <div className="space-y-4">
                                        {profile.experiences.map((exp, i) => (
                                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs text-white/40">Expérience {i + 1}</span>
                                                    <button onClick={() => removeExperience(i)} className="text-red-400 hover:text-red-300">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} placeholder="Entreprise" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                                                    <input value={exp.title} onChange={(e) => updateExperience(i, 'title', e.target.value)} placeholder="Poste" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                                                    <input value={exp.start_date} onChange={(e) => updateExperience(i, 'start_date', e.target.value)} placeholder="Début (ex: Jan 2024)" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                                                    <input value={exp.end_date} onChange={(e) => updateExperience(i, 'end_date', e.target.value)} placeholder="Fin (ou 'Présent')" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                                                </div>
                                                <textarea value={exp.description} onChange={(e) => updateExperience(i, 'description', e.target.value)} placeholder="Description des missions..." rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Education Section */}
                        {activeSection === 'education' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5 text-emerald-400" />
                                        Formation
                                    </h2>
                                    <button onClick={addEducation} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors">
                                        <Plus className="w-4 h-4" /> Ajouter
                                    </button>
                                </div>
                                {profile.education.length === 0 ? (
                                    <p className="text-white/40 text-center py-8">Aucune formation ajoutée</p>
                                ) : (
                                    <div className="space-y-4">
                                        {profile.education.map((edu, i) => (
                                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs text-white/40">Formation {i + 1}</span>
                                                    <button onClick={() => removeEducation(i)} className="text-red-400 hover:text-red-300">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input value={edu.school} onChange={(e) => updateEducation(i, 'school', e.target.value)} placeholder="École / Université" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                                                    <input value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} placeholder="Diplôme" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                                                    <input value={edu.field} onChange={(e) => updateEducation(i, 'field', e.target.value)} placeholder="Domaine (ex: Informatique)" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                                                    <div className="flex gap-2">
                                                        <input value={edu.start_year} onChange={(e) => updateEducation(i, 'start_year', e.target.value)} placeholder="Début" className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                                                        <input value={edu.end_year} onChange={(e) => updateEducation(i, 'end_year', e.target.value)} placeholder="Fin" className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Projects Section */}
                        {activeSection === 'projects' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <FolderKanban className="w-5 h-5 text-orange-400" />
                                        Projets
                                    </h2>
                                    <button onClick={addProject} className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors">
                                        <Plus className="w-4 h-4" /> Ajouter
                                    </button>
                                </div>
                                {profile.projects.length === 0 ? (
                                    <p className="text-white/40 text-center py-8">Aucun projet ajouté</p>
                                ) : (
                                    <div className="space-y-4">
                                        {profile.projects.map((proj, i) => (
                                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs text-white/40">Projet {i + 1}</span>
                                                    <button onClick={() => removeProject(i)} className="text-red-400 hover:text-red-300">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input value={proj.name} onChange={(e) => updateProject(i, 'name', e.target.value)} placeholder="Nom du projet" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
                                                    <input value={proj.url} onChange={(e) => updateProject(i, 'url', e.target.value)} placeholder="URL (GitHub, demo...)" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
                                                </div>
                                                <textarea value={proj.description} onChange={(e) => updateProject(i, 'description', e.target.value)} placeholder="Description du projet..." rows={2} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
                                                <input value={proj.skills} onChange={(e) => updateProject(i, 'skills', e.target.value)} placeholder="Technologies utilisées (React, Python...)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Skills Section */}
                        {activeSection === 'skills' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Code className="w-5 h-5 text-pink-400" />
                                    Compétences
                                </h2>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-pink-300 uppercase tracking-wider">Skills (séparées par virgules)</label>
                                    <textarea
                                        value={Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}
                                        onChange={(e) => updateField('skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                        placeholder="React, Python, SQL, Docker, TypeScript..."
                                        rows={4}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50"
                                    />
                                </div>
                                {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 bg-pink-500/20 text-pink-300 text-sm rounded-full border border-pink-500/30">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

// Reusable Input component
function Input({ label, value, onChange, placeholder, className = '' }) {
    return (
        <div className={`space-y-1 ${className}`}>
            <label className="text-xs font-medium text-white/50">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
            />
        </div>
    );
}
