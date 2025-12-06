import createClient from "@/lib/supabase/server";


async function LikedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: jobLiked, error } = await supabase.from('applications').select('*,jobs(*)').eq('user_id', user.id);
    if (!jobLiked || jobLiked.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-lg mx-auto px-4">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Liked Jobs</h1>
                        <a href="/jobs" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                            ← Back to Jobs
                        </a>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <p className="text-2xl mb-2">💼</p>
                        <p className="text-xl font-semibold text-gray-800">No liked jobs yet!</p>
                        <p className="text-gray-600 mt-2">Go swipe some jobs to see them here.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-lg mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Liked Jobs</h1>
                    <a href="/jobs" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                        ← Back to Jobs
                    </a>
                </div>
                <p className="text-sm text-gray-500 mb-4">{jobLiked.length} job{jobLiked.length > 1 ? 's' : ''} liked</p>
                <div className="space-y-4">
                    {jobLiked.map(job => (
                        <div key={job.id} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition">
                            <h2 className="text-lg font-bold text-gray-800">{job.jobs.title}</h2>
                            <p className="text-blue-600">{job.jobs.company_name}</p>
                            <p className="text-gray-500 text-sm mt-1">📍 {job.jobs.location_city}</p>
                            <span className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                ❤️ Liked
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )



}

export default LikedPage;