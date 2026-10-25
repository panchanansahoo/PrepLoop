import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const host = process.env.SMTP_HOST || 'smtp.resend.com';
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER || (host.includes('resend') ? 'resend' : undefined);
const pass = process.env.SMTP_PASS || process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"PrepLoop" <support@preploop.me>';

console.log(`\n==========================================`);
console.log(`  PrepLoop SMTP Verification`);
console.log(`==========================================`);
console.log(`  Host: ${host}`);
console.log(`  Port: ${port}`);
console.log(`  User: ${user || '(not set)'}`);
console.log(`  Pass: ${pass ? pass.slice(0, 10) + '...' : '(empty)'}`);
console.log(`  From: ${fromAddress}\n`);

if (!pass || pass.includes('your_resend_api_key') || pass.includes('your_smtp_password')) {
  console.error(`❌ SMTP_PASS (or RESEND_API_KEY) in .env is not set.`);
  if (host.includes('resend')) {
    console.error(`   Resend requires an API Key starting with "re_".`);
    console.error(`   1. Create an API Key at: https://resend.com/api-keys`);
    console.error(`   2. Set SMTP_PASS=re_xxxxxxxxxxxx in backend/.env`);
    console.error(`   3. Ensure SMTP_USER=resend\n`);
  }
  process.exit(1);
}

if (host.includes('resend') && pass.startsWith('xsmtpsib-')) {
  console.error(`❌ SMTP_PASS in .env is still set to an old Brevo key (starts with "xsmtpsib-").`);
  console.error(`   For Resend (smtp.resend.com), generate a Resend API Key starting with "re_":`);
  console.error(`   https://resend.com/api-keys\n`);
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

transporter.verify((err, _success) => {
  if (err) {
    console.error(`❌ SMTP Connection Failed:`, err.message);
    if (err.message.includes('535') || err.message.includes('authentication') || err.message.includes('Invalid login')) {
      console.error(`\nHint: Authentication failed means:`);
      if (host.includes('resend')) {
        console.error(`  1. The Resend API Key is invalid or expired (must start with "re_").`);
        console.error(`  2. SMTP_USER must be set to "resend".`);
        console.error(`  3. Generate a new key at https://resend.com/api-keys`);
      } else {
        console.error(`  1. The SMTP Key or password is invalid.`);
        console.error(`  2. Or SMTP_USER does not match the provider's login user.`);
      }
    }
    process.exit(1);
  } else {
    console.log(`✅ SUCCESS! SMTP credentials are valid and ready to send emails.`);
    if (host.includes('resend')) {
      console.log(`\nResend Configuration Notes:`);
      console.log(`  - Configured Sender: ${fromAddress}`);
      console.log(`  - Ensure the domain in your sender address (e.g. preploop.me) is verified in:`);
      console.log(`    https://resend.com/domains`);
      console.log(`  - If testing before domain DNS verification, set EMAIL_FROM="onboarding@resend.dev"`);
      console.log(`    (Resend only delivers to your account email when using onboarding@resend.dev)`);
    }
    process.exit(0);
  }
});
