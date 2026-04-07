import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from '@/lib/auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, name, progress } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email destination is missing' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Inter', 'Segoe UI', sans-serif; background-color: #F9FAFB; margin: 0; padding: 40px 0; }
    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #F3F4F6; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }
    .header { padding: 40px 40px 20px; text-align: center; }
    .header h1 { color: #111827; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px; }
    .body { padding: 0 40px 40px; text-align: center; }
    .body h2 { color: #111827; font-size: 18px; margin: 0 0 16px; font-weight: 600; }
    .body p { color: #6B7280; font-size: 14.5px; line-height: 1.6; margin: 0 0 32px; }
    .btn { display: inline-block; background-color: #111827; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 9px; font-size: 14.5px; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .divider { border: none; border-top: 1px dashed #E5E7EB; margin: 32px 0; }
    .footer { text-align: center; padding: 24px 40px; background-color: #F9FAFB; border-top: 1px solid #F3F4F6; }
    .footer p { font-size: 12px; color: #9CA3AF; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>On Board</h1>
    </div>
    <div class="body">
      <h2>Halo, ${name}</h2>
      <p>
        Ini adalah pesan pengingat otomatis. Kami melihat bahwa progres orientasi Anda saat ini baru mencapai <strong>${progress}%</strong>.
      </p>
      <p>
        Agar proses integrasi Anda di perusahaan dapat berjalan optimal dan lancar, mohon segera selesaikan tugas-tugas Anda.
      </p>
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/" class="btn">Lanjutkan Onboarding</a>
      
      <hr class="divider" />
      
      <p style="font-size:13px; color:#9CA3AF; margin-bottom: 0;">
        Gunakan AI Chatbot di dalam portal jika Anda membutuhkan bantuan seputar peraturan perusahaan.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} On Board Flow. Pesan ini dikirim secara otomatis.</p>
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"On Board" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      subject: 'On Board',
      html: htmlContent,
    });

    // Get employee user_id from profiles table to send them a notification
    const { data: employeeData } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    // 2. Notification for Employee (The actual reminder)
    if (employeeData?.id) {
      await supabaseAdmin.from('notifications').insert({
        type: 'hr_reminder',
        title: 'Pesan dari HR',
        message: `Tim HR mengirimkan pengingat untuk menyelesaikan tugas onboarding Anda. Silakan cek progres Anda.`,
        user_id: employeeData.id,
        is_read: false,
      });
    }

    return NextResponse.json({ message: 'Reminder sent successfully', messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
