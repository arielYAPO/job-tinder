'use client'
import createClient from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, ArrowRight, Sparkles } from "lucide-react";

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            }
            else {
                await supabase.from('profiles').insert({
                    user_id: data.user.id,
                    full_name: name,
                    onboarding_step: 0
                });
                router.push('/jobs');
                // Don't set loading false here to prevent flash before redirect
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 relative overflow-hidden">

            {/* Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.1]"
                style={{
                    backgroundImage: "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            <div className="relative z-10 w-full max-w-md">

                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight">Scope</span>
                    </div>
                </div>

                <div className="bg-[#1a1a1a]/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden">

                    {/* Badge */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                    <h1 className="text-2xl font-bold text-center mb-2">Créer un compte</h1>
                    <p className="text-center text-white/40 mb-8 text-sm">Commencez votre voyage vers le job idéal</p>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                                Nom complet
                            </label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 mt-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Traitement...</span>
                                </>
                            ) : (
                                <>
                                    C'est parti <Sparkles className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="mt-8 text-center pt-8 border-t border-white/5">
                        <p className="text-white/40 text-sm">
                            Déjà un compte ?{' '}
                            <a href="/login" className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                                Se connecter
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Signup;
