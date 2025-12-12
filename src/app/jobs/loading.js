export default function Loading() {
    return (
        <div className="min-h-screen bg-haze">
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center mb-8">
                    <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse" />
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-white/10 rounded-xl animate-pulse" />
                        <div className="h-10 w-24 bg-white/10 rounded-xl animate-pulse" />
                    </div>
                </div>

                {/* Card Skeleton */}
                <div className="glass gradient-border rounded-3xl p-6 h-[500px] flex flex-col">
                    {/* Title */}
                    <div className="h-8 w-3/4 bg-white/10 rounded-lg animate-pulse mb-3" />
                    <div className="h-5 w-1/2 bg-white/10 rounded-lg animate-pulse mb-6" />

                    {/* Tags */}
                    <div className="flex gap-2 mb-6">
                        <div className="h-8 w-24 bg-white/10 rounded-full animate-pulse" />
                        <div className="h-8 w-20 bg-white/10 rounded-full animate-pulse" />
                        <div className="h-8 w-28 bg-white/10 rounded-full animate-pulse" />
                    </div>

                    {/* Description lines */}
                    <div className="flex-1 space-y-3">
                        <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                        <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse" />
                        <div className="h-4 w-4/5 bg-white/10 rounded animate-pulse" />
                        <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                        <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="h-14 bg-white/10 rounded-2xl animate-pulse" />
                        <div className="h-14 bg-gradient-to-r from-[var(--primary)]/30 to-[var(--secondary)]/30 rounded-2xl animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
