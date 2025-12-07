'use client'
import createClient from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const supabase = createClient();
    const router = useRouter();

    const handleSignup = async (e) => {
        e.preventDefault();
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
        }
        else {
            await supabase.from('profiles').insert({
                user_id: data.user.id,
                full_name: name
            });
            router.push('/jobs');
        }
    }

    return (
        <div className="min-h-screen bg-haze flex items-center justify-center px-4">
            <div className="glass gradient-border rounded-2xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-2 text-white">
                    Join <span className="text-neon">JobTinder</span>
                </h1>
                <p className="text-center text-[var(--foreground-muted)] mb-8">Find your dream job</p>

                <form onSubmit={handleSignup} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2 tracking-wide">
                            NAME
                        </label>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--surface)] border border-white/10 rounded-xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2 tracking-wide">
                            EMAIL
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--surface)] border border-white/10 rounded-xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2 tracking-wide">
                            PASSWORD
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--surface)] border border-white/10 rounded-xl text-white placeholder-[var(--foreground-dim)] focus:border-[var(--primary)]"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-[var(--primary)] text-black font-semibold rounded-xl hover:glow-primary transition-all active:scale-[0.98]"
                    >
                        Create Account
                    </button>
                </form>

                {error && (
                    <p className="mt-4 text-[var(--danger)] text-center text-sm">{error}</p>
                )}

                <p className="mt-6 text-center text-[var(--foreground-muted)] text-sm">
                    Already have an account?{' '}
                    <a href="/login" className="text-[var(--primary)] hover:underline">
                        Login
                    </a>
                </p>
            </div>
        </div>
    )
}

export default Signup;
