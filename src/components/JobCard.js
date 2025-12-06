'use client'
import createClient from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function JobCard({ job, onSwipe }) {
    const supabase = createClient();

    const handleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('swipes').insert({
            user_id: user.id,
            job_id: job.id,
            action: 'like'
        })

        await supabase.from('applications').insert({
            user_id: user.id,
            job_id: job.id,
            status: 'draft'

        })
        if (onSwipe) onSwipe();
    };



    //HANDLE PASS
    const handlePass = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('swipes').insert({
            user_id: user.id,
            job_id: job.id,
            action: 'pass'
        });

        if (onSwipe) onSwipe();
    };
    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800">{job.title}</h2>
            <h3 className="text-lg text-blue-600 mt-1">{job.company_name}</h3>
            <p className="text-gray-600 mt-3">{job.description}</p>
            <p className="text-gray-500 mt-2 text-sm">📍 {job.location_city || job.location}</p>
            <div className="flex gap-4 mt-6">
                <button
                    onClick={handlePass}
                    className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                >
                    ❌ Pass
                </button>
                <button
                    onClick={handleLike}
                    className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                >
                    ❤️ Like
                </button>
            </div>
        </div>
    )

}

export default JobCard;