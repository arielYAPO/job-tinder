import createClient from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import JobSwiper from "@/components/JobSwiper";


async function JobsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: swipes } = await supabase.from('swipes').select('job_id').eq('user_id', user.id);
    const swipedIds = swipes ? swipes.map((s) => s.job_id) : [];

    let query = supabase.from('jobs').select('*');
    if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
    }

    const { data, error } = await query;
    if (error) {
        return <p>Error loading job</p>;
    }
    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-lg mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">JobTinder</h1>
                    <div className="flex gap-2">
                        <a href="/profile" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                            👤 Profile
                        </a>
                        <a href="/liked" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm">
                            ❤️ Liked
                        </a>
                        <LogoutButton />
                    </div>
                </div>
                <JobSwiper jobs={data} />
            </div>
        </div>
    )

}

export default JobsPage;