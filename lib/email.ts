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
    body { font-family: 'Segoe UI', sans-serif; background: #EBF4FA; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.08); }
    .header { background: #1E4D6B; padding: 40px 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; margin: 0 0 4px; letter-spacing: -0.5px; }
    .header p { color: #B5DBEC; font-size: 13px; margin: 0; }
    .body { padding: 40px; }
    .body h2 { color: #1E4D6B; font-size: 18px; margin: 0 0 12px; }
    .body p { color: #5A7A8C; font-size: 14px; line-height: 1.7; margin: 0 0 20px; }
    .btn { display: inline-block; background: #1E4D6B; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700; letter-spacing: 0.2px; }
    .btn:hover { background: #236181; }
    .divider { border: none; border-top: 1px solid #E8EFF4; margin: 24px 0; }
    .link-box { background: #F0F7FB; border-radius: 10px; padding: 12px 16px; word-break: break-all; font-size: 12px; color: #5A7A8C; }
    .footer { text-align: center; padding: 24px 40px; background: #F8FAFC; }
    .footer p { font-size: 11px; color: #9AADB8; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Onboard.</h1>
      <p>Platform Orientasi Karyawan</p>
    </div>
    <div class="body">
      <h2>Selamat datang, ${fullName}! 👋</h2>
      <p>
        Anda telah diundang untuk bergabung di <strong>OnboardFlow</strong>. 
        Klik tombol di bawah untuk mengatur kata sandi dan memulai perjalanan onboarding Anda.
      </p>
      <a href="${inviteUrl}" class="btn">Atur Kata Sandi &amp; Masuk →</a>
      <hr class="divider" />
      <p style="font-size:13px; color:#9AADB8;">
        Link ini berlaku selama <strong>48 jam</strong>. Jika Anda tidak mengharapkan undangan ini, abaikan email ini.
      </p>
      <p style="font-size:12px; color:#C0CDD4;">Atau copy link berikut ke browser:</p>
      <div class="link-box">${inviteUrl}</div>
    </div>
    <div class="footer">
      <p>© 2026 OnboardFlow · Dikirim secara otomatis, jangan reply email ini.</p>
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
    from: `"OnboardFlow" <${SMTP_FROM}>`,
    to: email,
    subject: `Undangan Bergabung – OnboardFlow`,
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
    <div class="footer"><p>© 2026 OnboardFlow</p></div>
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
    from: `"OnboardFlow" <${SMTP_FROM}>`,
    to: email,
    subject: `Kode Masuk OnboardFlow: ${otp}`,
    html: htmlBody,
  });
}
