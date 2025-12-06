'use client'
import createClient from "@/lib/supabase/client";
import { useState, useEffect } from "react";

function ProfilePage() {
    const [name, setName] = useState('');
    const [skills, setSkills] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        async function loadProfile() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (profile) {
                    setName(profile.full_name || '');
                    setSkills(profile.skills ? profile.skills.join(', ') : '');
                    setLocation(profile.location || '');
                }
            }
            setLoading(false);
        }
        loadProfile();
    }, []);

    const handleSave = async () => {
        setMessage('');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Convert skills string to array
        const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: name,
                skills: skillsArray,
                location: location
            })
            .eq('user_id', user.id);

        if (error) {
            setMessage('Error saving profile');
        } else {
            setMessage('Profile saved!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-lg mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                    <a href="/jobs" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                        ← Back to Jobs
                    </a>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                            <input
                                type="text"
                                value={skills}
                                onChange={(e) => setSkills(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="React, JavaScript, Python (comma separated)"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Paris, France"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                        >
                            💾 Save Profile
                        </button>

                        {message && (
                            <p className={`text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
