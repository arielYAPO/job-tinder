import { redirect } from "next/navigation";
import createClient from "@/lib/supabase/server";
import HomeButtons from "@/components/HomeButtons";
import { Search, Sparkles, Zap, ArrowRight, Target, BrainCircuit } from "lucide-react";

export default async function Home() {
  // Check if user is already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, redirect to jobs
  if (user) {
    redirect('/jobs');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative selection:bg-indigo-500/30">

      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.15]"
        style={{
          backgroundImage: "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Header / Nav */}
      <header className="relative z-10 w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Scope</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-white/50 text-sm font-medium">
          <a href="#" className="hover:text-white transition-colors">Comment ça marche</a>
          <a href="#" className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#" className="hover:text-white transition-colors">Tarifs</a>
        </nav>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Connexion</a>
          <a href="/signup" className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors">S'inscrire</a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center max-w-5xl mx-auto">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span className="text-xs font-medium text-indigo-300">Nouveau : Agent Carrière IA</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          Accédez au <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Marché Caché.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-12 leading-relaxed">
          Arrêtez de postuler aux mêmes offres que 500 autres candidats. Scope analyse la stack technique des startups pour vous aider à cibler les meilleures entreprises pour vos candidatures spontanées.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md mx-auto mb-20">
          <HomeButtons />
        </div>

        {/* Floating UI Elements (Decoration) */}
        <div className="relative w-full max-w-4xl mx-auto hidden md:block">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-20"></div>

          <div className="grid grid-cols-3 gap-6 opacity-30 blur-[1px] transform scale-[0.85] hover:scale-[0.9] hover:opacity-50 hover:blur-0 transition-all duration-700">
            {/* Card 1 */}
            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="h-4 w-24 bg-white/10 rounded mb-2"></div>
                <div className="h-3 w-16 bg-white/5 rounded"></div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs">98% Match</span>
              </div>
            </div>

            {/* Card 2 (Center - Highlighted) */}
            <div className="bg-[#1e1e1e] border border-indigo-500/30 rounded-2xl p-6 flex flex-col gap-4 shadow-lg shadow-indigo-500/10 transform -translate-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Choix IA
                </span>
              </div>
              <div>
                <h3 className="text-white font-medium text-lg">Ingénieur IA</h3>
                <p className="text-white/40 text-sm">Mistral AI • Paris</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-white/60 leading-relaxed">
                "Tu as le profil idéal pour leur équipe Core Team. Ils cherchent quelqu'un avec ta maitrise de Rust..."
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="h-4 w-24 bg-white/10 rounded mb-2"></div>
                <div className="h-3 w-16 bg-white/5 rounded"></div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs">92% Match</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center border-t border-white/5 bg-[#0a0a0a]">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center">
            <Target className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white/80">Scope</span>
        </div>
        <p className="text-sm text-white/30">
          Conçu pour le futur du travail. © 2024 Scope.
        </p>
      </footer>
    </div>
  );
}
