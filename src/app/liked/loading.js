export default function Loading() {
    return (
        <div className="min-h-screen bg-haze">
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center mb-8">
                    <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse" />
                    <div className="h-10 w-20 bg-white/10 rounded-xl animate-pulse" />
                </div>

                {/* Jobs count skeleton */}
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-6 ml-1" />

                {/* Job cards skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass rounded-xl p-6 border border-white/5">
                            <div className="h-6 w-3/4 bg-white/10 rounded-lg animate-pulse mb-2" />
                            <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse mb-4" />
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                <div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
                                <div className="h-8 w-28 bg-white/10 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
