'use client'
import { useState } from 'react'
import { Filter, MapPin, X } from 'lucide-react'

function JobFilters({ filters, onFilterChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [location, setLocation] = useState('');

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
                </button>
            </div>

            {/* Filter Panel (Dropdown animation) */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="glass p-5 rounded-2xl border border-white/10 shadow-xl max-w-sm mx-auto">

                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Refine Search</h3>
                        {location && (
                            <button
                                onClick={() => { setLocation(''); onFilterChange({ location: '' }); }}
                                className="text-xs text-[var(--foreground-muted)] hover:text-white flex items-center gap-1"
                            >
                                <X className="w-3 h-3" /> Clear
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
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--primary)] focus:bg-black/30 transition-all"
                            />
                        </div>

                        {/* Apply Button */}
                        <button
                            onClick={() => onFilterChange({ location })}
                            className="w-full py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
