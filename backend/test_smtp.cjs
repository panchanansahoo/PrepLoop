const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.sendMail({
  from: '"PrepLoop Test" <' + process.env.SMTP_USER + '>',
  to: 'javasahooai@gmail.com',  
  subject: 'PrepLoop SMTP Test ✅',
  text: 'This is a test email to verify that your SMTP configuration is working correctly!'
}, (err, info) => {
  if (err) {
    console.error('Error sending email:', err);
  } else {
    console.log('Successfully sent email! Message ID: ' + info.messageId);
  }
});
