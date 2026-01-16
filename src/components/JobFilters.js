'use client'
import { useState } from 'react'
import { Filter, X, Briefcase, Building2, Laptop, Target } from 'lucide-react'

function JobFilters({ filters, onFilterChange, availableSectors = [], targetRole, onTargetRoleChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [contractType, setContractType] = useState('');
    const [sector, setSector] = useState('');
    const [stack, setStack] = useState('');
    const [localTargetRole, setLocalTargetRole] = useState(targetRole || '');

    const handleApply = () => {
        onFilterChange({
            contractType,
            sector,
            stack,
        });
        if (onTargetRoleChange) {
            onTargetRoleChange(localTargetRole);
        }
    };

    const handleClear = () => {
        setContractType('');
        setSector('');
        setStack('');
        setLocalTargetRole('');
        onFilterChange({ contractType: '', sector: '', stack: '' });
        if (onTargetRoleChange) {
            onTargetRoleChange('');
        }
    };

    const hasFilters = contractType || sector || stack || localTargetRole;

    return (
        <div className="relative z-50 mb-6">
            {/* Filter Toggle Button */}
            <div className="flex justify-center">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-lg ${isOpen
                        ? 'bg-[var(--primary)] text-black shadow-[var(--primary)]/25'
                        : 'bg-white/10 text-white hover:bg-white/15 border border-white/5'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    <span>Filtres</span>
                    {hasFilters && (
                        <span className="w-2 h-2 bg-[var(--secondary)] rounded-full animate-pulse" />
                    )}
                </button>
            </div>

            {/* Filter Panel */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="glass p-5 rounded-2xl border border-white/10 shadow-xl max-w-sm mx-auto">

                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Affiner</h3>
                        {hasFilters && (
                            <button
                                onClick={handleClear}
                                className="text-xs text-[var(--foreground-muted)] hover:text-white flex items-center gap-1"
                            >
                                <X className="w-3 h-3" /> Effacer
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">

                        {/* Target Role (NEW - moved from header) */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-dim)]">
                                <Target className="w-4 h-4" />
                            </div>
                            <select
                                value={localTargetRole}
                                onChange={(e) => setLocalTargetRole(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--primary)] focus:bg-black/30 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900">🎯 Rôle cible (Auto)</option>
                                <option value="frontend" className="bg-gray-900">Frontend</option>
                                <option value="backend" className="bg-gray-900">Backend</option>
                                <option value="fullstack" className="bg-gray-900">Fullstack</option>
                                <option value="mobile" className="bg-gray-900">Mobile (iOS/Android)</option>
                                <option value="data_engineer" className="bg-gray-900">Data Engineer</option>
                                <option value="data_scientist" className="bg-gray-900">Data Scientist</option>
                                <option value="ml_engineer" className="bg-gray-900">AI / ML Engineer</option>
                                <option value="llm_engineer" className="bg-gray-900">GenAI / LLM Engineer</option>
                                <option value="devops" className="bg-gray-900">DevOps / SRE</option>
                                <option value="product" className="bg-gray-900">Product (PM)</option>
                                <option value="design" className="bg-gray-900">Design (UX/UI)</option>
                            </select>
                        </div>

                        {/* Sector Dropdown */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-dim)]">
                                <Building2 className="w-4 h-4" />
                            </div>
                            <select
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--primary)] focus:bg-black/30 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900">Tous les secteurs</option>
                                {availableSectors.map((s) => (
                                    <option key={s} value={s} className="bg-gray-900">{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Stack Input */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-dim)] group-focus-within:text-[var(--primary)] transition-colors">
                                <Laptop className="w-4 h-4" />
                            </div>
                            <input
                                value={stack}
                                onChange={(e) => setStack(e.target.value)}
                                placeholder="Tech (ex: React, Python)..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--primary)] focus:bg-black/30 transition-all"
                            />
                        </div>

                        {/* Contract Type */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-dim)]">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <select
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--primary)] focus:bg-black/30 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900">Types de contrat</option>
                                <option value="alternance" className="bg-gray-900">Alternance</option>
                                <option value="apprentissage" className="bg-gray-900">Apprentissage</option>
                                <option value="stage" className="bg-gray-900">Stage</option>
                                <option value="cdi" className="bg-gray-900">CDI</option>
                                <option value="cdd" className="bg-gray-900">CDD</option>
                            </select>
                        </div>

                        {/* Apply Button */}
                        <button
                            onClick={handleApply}
                            className="w-full py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all mt-1"
                        >
                            Appliquer les filtres
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JobFilters
