export default function Loading() {
    return (
        <div className="min-h-screen bg-haze">
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center mb-8">
                    <div className="h-8 w-40 bg-white/10 rounded-lg animate-pulse" />
                </div>

                {/* Profile form skeleton */}
                <div className="glass gradient-border rounded-2xl p-6 space-y-6">
                    {/* Avatar placeholder */}
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-white/10 rounded-full animate-pulse" />
                    </div>

                    {/* Form fields */}
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                            <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse" />
                        </div>
                    ))}

                    {/* Save button */}
                    <div className="h-12 w-full bg-gradient-to-r from-[var(--primary)]/30 to-[var(--secondary)]/30 rounded-xl animate-pulse mt-6" />
                </div>
            </div>
        </div>
    );
}
