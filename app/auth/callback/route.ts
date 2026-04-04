import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Fetch profile to determine if admin
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        // Redirect based on role
        if (profile?.is_admin) {
           return NextResponse.redirect(`${origin}/admin`)
        } else {
           return NextResponse.redirect(`${origin}/karyawan`)
        }
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
}
