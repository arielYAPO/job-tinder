import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
    // Create a response
    let response = NextResponse.next()

    // Create supabase client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Get user
    const { data: { user } } = await supabase.auth.getUser()

    // Protected routes (need login)
    const protectedPaths = ['/jobs', '/liked', '/profile'];
    const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));
    if (isProtected && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Auth routes (redirect if already logged in)
    if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
        return NextResponse.redirect(new URL('/jobs', request.url))
    }

    return response
}

// Which routes to run middleware on
export const config = {
    matcher: ['/jobs/:path*', '/liked/:path*', '/profile/:path*', '/login', '/signup'],
}