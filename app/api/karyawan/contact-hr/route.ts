import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile to include name/dept in notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, department')
      .eq('id', session.userId)
      .single();

    const name = profile?.full_name || 'Karyawan';
    const dept = profile?.department || '-';

    // Create Notification for Admin/HR
    const { error } = await supabase.from('notifications').insert({
      type: 'hr_contact',
      title: 'Bantuan Diperlukan',
      message: `${name} (${dept}) meminta bantuan melalui Hubungi HR.`,
      user_id: null, // null means global/admin, so the employee doesn't see their own request as a notification
      is_read: false
    });

    if (error) throw error;

    return NextResponse.json({ message: 'Request sent successfully' });
  } catch (error: any) {
    console.error('Error contacting HR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
