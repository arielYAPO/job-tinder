import supabase from "@/lib/supabase";

async function TestPage() {
    const { data, error } = await supabase.from('jobs').select('*');
    console.log(data);
    return (
        <div>
            <h1>Test Page</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    )
}

export default TestPage
