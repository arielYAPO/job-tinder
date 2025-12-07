'use client'
import createClient from "@/lib/supabase/client";
import { useState, useEffect } from "react";

function ProfilePage() {
    // Basic profile states
    const [name, setName] = useState('');
    const [skills, setSkills] = useState('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');
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
                setSkills(profile.skills ? profile.skills.join(', ') : '');
                setLocation(profile.location || '');
                setBio(profile.bio || '');
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
        }
        setLoading(false);
    }

    const handleSave = async () => {
        setMessage('');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: name,
                skills: skillsArray,
                location: location,
                bio: bio
            })
            .eq('user_id', user.id);

        if (error) {
            setMessage('Error saving profile');
        } else {
            setMessage('Profile saved!');
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
                        My <span className="text-neon">Profile</span>
                    </h1>
                    <a href="/jobs" className="px-4 py-2 bg-[var(--primary)] text-black font-medium rounded-xl hover:glow-primary transition text-sm">
                        ← Back
                    </a>
                </div>

                {/* Basic Info Card */}
                <div className="glass gradient-border rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-white mb-4">Basic Info</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2 tracking-wide">
                                FULL NAME
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--surface)] border border-white/10 rounded-xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)]"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2 tracking-wide">
                                SKILLS
                            </label>
                            <input
                                type="text"
                                value={skills}
                                onChange={(e) => setSkills(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--surface)] border border-white/10 rounded-xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)]"
                                placeholder="React, JavaScript, Python"
                            />
                            <p className="text-xs text-[var(--foreground-dim)] mt-1">Separate with commas</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2 tracking-wide">
                                LOCATION
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--surface)] border border-white/10 rounded-xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)]"
                                placeholder="Paris, France"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2 tracking-wide">
                                BIO
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-[var(--surface)] border border-white/10 rounded-xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)] resize-none"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full py-3 bg-[var(--primary)] text-black font-semibold rounded-xl hover:glow-primary transition-all active:scale-[0.98]"
                        >
                            💾 Save Profile
                        </button>

                        {message && (
                            <p className={`text-center text-sm ${message.includes('Error') ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Experience Section */}
                <div className="glass gradient-border rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-white mb-4">💼 Work Experience</h2>

                    {/* Existing experiences as cards */}
                    {experiences.length > 0 ? (
                        <div className="space-y-3 mb-4">
                            {experiences.map(exp => (
                                <div key={exp.id} className="bg-white/5 rounded-xl p-4 relative group">
                                    <button
                                        onClick={() => handleDeleteExperience(exp.id)}
                                        className="absolute top-3 right-3 text-[var(--foreground-dim)] hover:text-[var(--danger)] transition opacity-0 group-hover:opacity-100"
                                    >
                                        🗑️
                                    </button>
                                    <p className="font-semibold text-white pr-8">{exp.job_title}</p>
                                    <p className="text-[var(--primary)] text-sm">{exp.company}</p>
                                    <p className="text-[var(--foreground-dim)] text-xs mt-1">
                                        {exp.start_date} → {exp.is_current ? 'Present' : (exp.end_date || 'N/A')}
                                    </p>
                                    {exp.description && (
                                        <p className="text-[var(--foreground-muted)] text-sm mt-2">{exp.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[var(--foreground-dim)] text-sm mb-4">No work experience added yet.</p>
                    )}

                    {/* Collapsible Add Form */}
                    {!showExpForm ? (
                        <button
                            onClick={() => setShowExpForm(true)}
                            className="w-full py-3 border-2 border-dashed border-white/20 text-[var(--foreground-muted)] rounded-xl hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                        >
                            + Add Experience
                        </button>
                    ) : (
                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-white font-medium">New Experience</p>
                                <button
                                    onClick={() => setShowExpForm(false)}
                                    className="text-[var(--foreground-dim)] hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={newJobTitle}
                                    onChange={(e) => setNewJobTitle(e.target.value)}
                                    className="px-4 py-2 bg-[var(--surface)] border border-white/10 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)]"
                                    placeholder="Job Title *"
                                />
                                <input
                                    type="text"
                                    value={newCompany}
                                    onChange={(e) => setNewCompany(e.target.value)}
                                    className="px-4 py-2 bg-[var(--surface)] border border-white/10 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)]"
                                    placeholder="Company *"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[var(--foreground-dim)]">Start Date</label>
                                    <input
                                        type="month"
                                        value={newStartDate}
                                        onChange={(e) => setNewStartDate(e.target.value)}
                                        className="w-full px-4 py-2 bg-[var(--surface)] border border-white/10 rounded-xl text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--foreground-dim)]">End Date</label>
                                    <input
                                        type="month"
                                        value={newEndDate}
                                        onChange={(e) => setNewEndDate(e.target.value)}
                                        disabled={isCurrent}
                                        className="w-full px-4 py-2 bg-[var(--surface)] border border-white/10 rounded-xl text-white text-sm disabled:opacity-50"
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                                <input
                                    type="checkbox"
                                    checked={isCurrent}
                                    onChange={(e) => setIsCurrent(e.target.checked)}
                                    className="rounded"
                                />
                                I currently work here
                            </label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2 bg-[var(--surface)] border border-white/10 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)] resize-none"
                                placeholder="Describe your role..."
                            />
                            <button
                                onClick={handleAddExperience}
                                className="w-full py-2 bg-[var(--primary)] text-black font-medium rounded-xl hover:glow-primary transition"
                            >
                                Save Experience
                            </button>
                        </div>
                    )}
                </div>

                {/* Education Section */}
                <div className="glass gradient-border rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">🎓 Education</h2>

                    {/* Existing education as cards */}
                    {education.length > 0 ? (
                        <div className="space-y-3 mb-4">
                            {education.map(edu => (
                                <div key={edu.id} className="bg-white/5 rounded-xl p-4 relative group">
                                    <button
                                        onClick={() => handleDeleteEducation(edu.id)}
                                        className="absolute top-3 right-3 text-[var(--foreground-dim)] hover:text-[var(--danger)] transition opacity-0 group-hover:opacity-100"
                                    >
                                        🗑️
                                    </button>
                                    <p className="font-semibold text-white pr-8">{edu.degree}</p>
                                    <p className="text-[var(--primary)] text-sm">{edu.school}</p>
                                    {edu.field_of_study && (
                                        <p className="text-[var(--foreground-muted)] text-sm">{edu.field_of_study}</p>
                                    )}
                                    {edu.graduation_year && (
                                        <p className="text-[var(--foreground-dim)] text-xs mt-1">Class of {edu.graduation_year}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[var(--foreground-dim)] text-sm mb-4">No education added yet.</p>
                    )}

                    {/* Collapsible Add Form */}
                    {!showEduForm ? (
                        <button
                            onClick={() => setShowEduForm(true)}
                            className="w-full py-3 border-2 border-dashed border-white/20 text-[var(--foreground-muted)] rounded-xl hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                        >
                            + Add Education
                        </button>
                    ) : (
                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-white font-medium">New Education</p>
                                <button
                                    onClick={() => setShowEduForm(false)}
                                    className="text-[var(--foreground-dim)] hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={newDegree}
                                    onChange={(e) => setNewDegree(e.target.value)}
                                    className="px-4 py-2 bg-[var(--surface)] border border-white/10 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)]"
                                    placeholder="Degree *"
                                />
                                <input
                                    type="text"
                                    value={newSchool}
                                    onChange={(e) => setNewSchool(e.target.value)}
                                    className="px-4 py-2 bg-[var(--surface)] border border-white/10 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)]"
                                    placeholder="School *"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={newField}
                                    onChange={(e) => setNewField(e.target.value)}
                                    className="px-4 py-2 bg-[var(--surface)] border border-white/10 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)]"
                                    placeholder="Field of Study"
                                />
                                <input
                                    type="number"
                                    value={newGradYear}
                                    onChange={(e) => setNewGradYear(e.target.value)}
                                    className="px-4 py-2 bg-[var(--surface)] border border-white/10 rounded-xl text-white text-sm placeholder-[var(--foreground-dim)]"
                                    placeholder="Grad Year"
                                />
                            </div>
                            <button
                                onClick={handleAddEducation}
                                className="w-full py-2 bg-[var(--primary)] text-black font-medium rounded-xl hover:glow-primary transition"
                            >
                                Save Education
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
