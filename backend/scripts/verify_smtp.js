import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log(`\nTesting SMTP Connection:`);
console.log(`  Host: ${host}`);
console.log(`  Port: ${port}`);
console.log(`  User: ${user}`);
console.log(`  Pass: ${pass ? pass.slice(0, 10) + '...' : '(empty)'}\n`);

if (!pass || pass.startsWith('10042001')) {
  console.error(`❌ SMTP_PASS in .env is still set to an account password.`);
  console.error(`   Brevo requires an SMTP Master Key starting with "xsmtpsib-".\n`);
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
    if (err.message.includes('535')) {
      console.error(`\nHint: 535 Authentication failed means:`);
      console.error(`  1. The SMTP Key is invalid or expired.`);
      console.error(`  2. Or SMTP_USER does not match the Brevo login user.`);
    }
    process.exit(1);
  } else {
    console.log(`✅ SUCCESS! SMTP credentials are valid and ready to send emails.`);
    process.exit(0);
  }
});
