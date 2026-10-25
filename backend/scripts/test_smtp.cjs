const nodemailer = require('nodemailer');
require('dotenv').config();

const host = process.env.SMTP_HOST || 'smtp.resend.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const useSecureTransport = smtpPort === 465;
const user = process.env.SMTP_USER || (host.includes('resend') ? 'resend' : undefined);
const pass = process.env.SMTP_PASS || process.env.RESEND_API_KEY;

const fromAddress = process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  (user && user.includes('@') ? `"${user}" <${user}>` : '"PrepLoop Test" <support@preploop.me>');

const targetEmail = process.argv[2] || process.env.TEST_EMAIL_TO || 'javasahooai@gmail.com';

const transporter = nodemailer.createTransport({
  host,
  port: smtpPort,
  secure: useSecureTransport,
  requireTLS: !useSecureTransport,
  tls: {
    minVersion: 'TLSv1.2'
  },
  auth: {
    user,
    pass
  }
});

console.log(`Sending test email via ${host}:${smtpPort} (TLS: ${!useSecureTransport})`);
console.log(`  From: ${fromAddress}`);
console.log(`  To:   ${targetEmail}\n`);

transporter.sendMail({
  from: fromAddress,
  to: targetEmail,  
  subject: 'PrepLoop SMTP Test ✅',
  text: 'This is a test email to verify that your Resend SMTP configuration is working correctly!'
}, (err, info) => {
  if (err) {
    console.error('❌ Error sending email:', err.message);
    if (err.message.includes('domain') || err.message.includes('from') || err.message.includes('verify')) {
      console.error('\nHint: If your domain (preploop.me) is not yet verified in Resend,');
      console.error('temporarily set EMAIL_FROM="onboarding@resend.dev" in .env and test sending to your Resend account email.');
    }
    process.exit(1);
  } else {
    console.log('✅ Successfully sent email! Message ID: ' + info.messageId);
    process.exit(0);
  }
});
