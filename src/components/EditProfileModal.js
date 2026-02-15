import { useState } from 'react'
import { X, Save, User, Briefcase, GraduationCap } from 'lucide-react'
import createClient from '@/lib/supabase/client'

export default function EditProfileModal({ user, profile, onClose, onSave, forced = false }) {
    const [loading, setLoading] = useState(false);
    const [skills, setSkills] = useState(profile?.skills?.join(', ') || '');
    const [objective, setObjective] = useState(profile?.objectif || '');
    const [contractType, setContractType] = useState(profile?.contrat_recherche || 'alternance');
    const [education, setEducation] = useState(profile?.formation || '');

    // Validation: can't save with empty required fields
    const canSave = skills.trim().length > 0 && objective.trim().length > 0;

    const handleSave = async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            // Parse skills from comma-separated string
            const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

            const updates = {
                skills: skillsArray,
                desired_position: objective,
                contract_type: contractType,
                education_level: education,
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('user_id', user.id);

            if (error) throw error;

            // Notify parent to refresh local state
            onSave({
                ...profile,
                skills: skillsArray,
                objectif: objective,
                contrat_recherche: contractType,
                formation: education
            });
            // Only auto-close if not forced (forced mode: parent handles)
            if (!forced && onClose) onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-400" />
                        {forced ? 'Bienvenue ! 👋' : 'Mon Profil'}
                    </h2>
                    {!forced && (
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Forced mode message */}
                {forced && (
                    <div className="px-6 py-3 bg-purple-500/10 border-b border-purple-500/20">
                        <p className="text-sm text-purple-300">Remplis ton profil pour commencer à matcher avec les offres 🚀</p>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 space-y-5">

                    {/* Objectif */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                            <Briefcase className="w-3 h-3" /> Objectif (Job visé)
                        </label>
                        <input
                            type="text"
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            placeholder="Ex: Développeur Fullstack, Data Scientist..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                        />
                        <p className="text-[10px] text-white/40">Sert à l'IA pour comprendre ce que tu cherches.</p>
                    </div>

                    {/* Skills */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                            <GraduationCap className="w-3 h-3" /> Compétences (Skills)
                        </label>
                        <textarea
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="React, Python, SQL, Docker..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[80px] focus:outline-none focus:border-emerald-500/50"
                        />
                        <p className="text-[10px] text-white/40">Sépare les compétences par des virgules.</p>
                    </div>



                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                    {!forced && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Annuler
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading || !canSave}
                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50"
                        title={!canSave ? 'Remplis objectif et skills' : ''}
                    >
                        {loading ? 'Sauvegarde...' : (
                            <>
                                <Save className="w-4 h-4" /> {forced ? 'Commencer !' : 'Sauvegarder'}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}
