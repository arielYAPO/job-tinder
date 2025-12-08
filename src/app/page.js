import { redirect } from "next/navigation";
import createClient from "@/lib/supabase/server";
import { Sparkles, ArrowRight, Zap, Target, FileText } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  // Check if user is already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, redirect to jobs
  if (user) {
    redirect('/jobs');
  }

  return (
    <div className="min-h-screen bg-haze flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Job<span className="text-neon">Tinder</span>
          </h1>
          <p className="text-[var(--foreground-muted)] mt-3 text-lg md:text-xl max-w-md mx-auto">
            Swipe your way to your dream apprenticeship
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl w-full">
          <div className="glass rounded-2xl p-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <h3 className="text-white font-semibold mb-1">Swipe Fast</h3>
            <p className="text-sm text-[var(--foreground-muted)]">Like Tinder, but for jobs. Pass or apply in seconds.</p>
          </div>
          <div className="glass rounded-2xl p-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-[var(--secondary)]/20 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-[var(--secondary)]" />
            </div>
            <h3 className="text-white font-semibold mb-1">AI Simplify</h3>
            <p className="text-sm text-[var(--foreground-muted)]">Long job descriptions? AI extracts what matters.</p>
          </div>
          <div className="glass rounded-2xl p-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold mb-1">Smart CV</h3>
            <p className="text-sm text-[var(--foreground-muted)]">Generate tailored CVs for each job automatically.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link
            href="/signup"
            className="flex-1 py-4 px-6 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-2xl text-center hover:scale-105 transition-transform shadow-lg shadow-[var(--primary)]/30 flex items-center justify-center gap-2"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="flex-1 py-4 px-6 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl text-center hover:bg-white/10 transition-colors"
          >
            Login
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-[var(--foreground-dim)]">
        Built for apprenticeship seekers in France 🇫🇷
      </footer>
    </div>
  );
}
