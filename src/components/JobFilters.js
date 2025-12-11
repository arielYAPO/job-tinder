'use client'
import { useState } from 'react'
import { Filter, MapPin, X, Briefcase, Building2, Laptop, User } from 'lucide-react'

function JobFilters({ filters, onFilterChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [location, setLocation] = useState('');
    const [contractType, setContractType] = useState('');
    const [source, setSource] = useState('');
    const [remoteOnly, setRemoteOnly] = useState(false);
    const [hasRecruiter, setHasRecruiter] = useState(false);

    const handleApply = () => {
        onFilterChange({
            location,
            contractType,
            source,
            remoteOnly,
            hasRecruiter
        });
    };

    const handleClear = () => {
        setLocation('');
        setContractType('');
        setSource('');
        setRemoteOnly(false);
        setHasRecruiter(false);
        onFilterChange({ location: '', contractType: '', source: '', remoteOnly: false, hasRecruiter: false });
    };

    const hasFilters = location || contractType || source || remoteOnly || hasRecruiter;

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
                    <span>Filters</span>
                    {hasFilters && (
                        <span className="w-2 h-2 bg-[var(--secondary)] rounded-full animate-pulse" />
                    )}
                </button>
            </div>

            {/* Filter Panel */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="glass p-5 rounded-2xl border border-white/10 shadow-xl max-w-sm mx-auto">

                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Refine Search</h3>
                        {hasFilters && (
                            <button
                                onClick={handleClear}
                                className="text-xs text-[var(--foreground-muted)] hover:text-white flex items-center gap-1"
                            >
                                <X className="w-3 h-3" /> Clear all
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Location Input */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-dim)] group-focus-within:text-[var(--primary)] transition-colors">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City (e.g. Paris, Lyon)..."
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
                                <option value="" className="bg-gray-900">All Contract Types</option>
                                <option value="alternance" className="bg-gray-900">Alternance</option>
                                <option value="apprentissage" className="bg-gray-900">Apprentissage</option>
                                <option value="stage" className="bg-gray-900">Stage</option>
                                <option value="cdi" className="bg-gray-900">CDI</option>
                                <option value="cdd" className="bg-gray-900">CDD</option>
                            </select>
                        </div>

                        {/* Source */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-dim)]">
                                <Building2 className="w-4 h-4" />
                            </div>
                            <select
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--primary)] focus:bg-black/30 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900">All Sources</option>
                                <option value="linkedin" className="bg-gray-900">LinkedIn</option>
                                <option value="labonnealternance" className="bg-gray-900">La Bonne Alternance</option>
                            </select>
                        </div>

                        {/* Remote Toggle */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`relative w-12 h-6 rounded-full transition-colors ${remoteOnly ? 'bg-[var(--primary)]' : 'bg-white/10'}`}>
                                <input
                                    type="checkbox"
                                    checked={remoteOnly}
                                    onChange={(e) => setRemoteOnly(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${remoteOnly ? 'left-7' : 'left-1'}`} />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] group-hover:text-white transition-colors">
                                <Laptop className="w-4 h-4" />
                                <span>Remote only</span>
                            </div>
                        </label>

                        {/* Has Recruiter Toggle */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`relative w-12 h-6 rounded-full transition-colors ${hasRecruiter ? 'bg-[var(--secondary)]' : 'bg-white/10'}`}>
                                <input
                                    type="checkbox"
                                    checked={hasRecruiter}
                                    onChange={(e) => setHasRecruiter(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasRecruiter ? 'left-7' : 'left-1'}`} />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] group-hover:text-white transition-colors">
                                <User className="w-4 h-4" />
                                <span>With recruiter info</span>
                            </div>
                        </label>

                        {/* Apply Button */}
                        <button
                            onClick={handleApply}
                            className="w-full py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all mt-1"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JobFilters
