import nodemailer from 'nodemailer';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@onboardflow.com';

/** Buat transporter Nodemailer. Jika SMTP tidak dikonfigurasi, pakai fallback console. */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  });
}

/** Kirim email undangan karyawan baru */
export async function sendInviteEmail(
  email: string,
  fullName: string,
  token: string
): Promise<void> {
  const inviteUrl = `${APP_URL}/set-password?token=${token}`;
  const transporter = createTransporter();

  const htmlBody = `
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
    .btn:hover { background-color: #1F2937; }
    .divider { border: none; border-top: 1px dashed #E5E7EB; margin: 32px 0; }
    .link-box { margin-top: 12px; font-size: 11.5px; color: #9CA3AF; word-break: break-all; }
    .footer { text-align: center; padding: 24px 40px; background-color: #F9FAFB; border-top: 1px solid #F3F4F6; }
    .footer p { font-size: 12px; color: #9CA3AF; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>OnBoard</h1>
    </div>
    <div class="body">
      <h2>Halo, ${fullName}</h2>
      <p>
        Anda telah diundang untuk bergabung ke dalam <strong>Portal Orientasi Karyawan</strong> kami. Lengkapi profil Anda dan mulailah proses onboarding dengan mengatur kata sandi Anda menggunakan tautan di bawah ini.
      </p>
      <a href="${inviteUrl}" class="btn">Bergabung Sekarang</a>
      
      <hr class="divider" />
      
      <p style="font-size:13px; color:#9CA3AF; margin-bottom: 0;">
        Link undangan di atas hanya berlaku selama <strong>48 jam</strong>.
      </p>
      <div class="link-box">Atau gunakan URL: <br/>${inviteUrl}</div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} OnboardFlow. Pesan ini dikirim secara otomatis.</p>
    </div>
  </div>
</body>
</html>`;

  if (!transporter) {
    // Dev fallback — tampilkan link di server console
    console.log('\n─────────────────────────────────────────');
    console.log('📧  EMAIL UNDANGAN (DEV MODE - SMTP belum dikonfigurasi)');
    console.log(`  Kepada : ${fullName} <${email}>`);
    console.log(`  Link   : ${inviteUrl}`);
    console.log('─────────────────────────────────────────\n');
    return;
  }

  await transporter.sendMail({
    from: `"OnBoard" <${SMTP_FROM}>`,
    to: email,
    subject: `OnBoard`,
    html: htmlBody,
  });
}

/** Kirim email OTP login (alternatif: login tanpa password dengan kode 6 digit) */
export async function sendLoginOtp(
  email: string,
  otp: string
): Promise<void> {
  const transporter = createTransporter();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #EBF4FA; margin: 0; }
    .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.08); }
    .header { background: #1E4D6B; padding: 32px 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 24px; margin: 0; }
    .body { padding: 40px; text-align: center; }
    .otp-box { font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #1E4D6B; background: #EBF4FA; border-radius: 16px; padding: 20px 32px; display: inline-block; margin: 20px 0; }
    .body p { color: #5A7A8C; font-size: 14px; line-height: 1.7; }
    .footer { text-align: center; padding: 20px; background: #F8FAFC; }
    .footer p { font-size: 11px; color: #9AADB8; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Onboard.</h1></div>
    <div class="body">
      <p>Kode masuk Anda:</p>
      <div class="otp-box">${otp}</div>
      <p>Kode ini berlaku selama <strong>10 menit</strong>.<br/>Jangan berikan kode ini ke siapapun.</p>
    </div>
    <div class="footer"><p>© 2026 OnBoard</p></div>
  </div>
</body>
</html>`;

  if (!transporter) {
    console.log('\n─────────────────────────────────────────');
    console.log('📧  OTP LOGIN (DEV MODE)');
    console.log(`  Kepada : ${email}`);
    console.log(`  Kode   : ${otp}`);
    console.log('─────────────────────────────────────────\n');
    return;
  }

  await transporter.sendMail({
    from: `"OnBoard" <${SMTP_FROM}>`,
    to: email,
    subject: `Kode Masuk OnBoard: ${otp}`,
    html: htmlBody,
  });
}
