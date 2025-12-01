const nodemailer = require("nodemailer");
require("dotenv").config();

// 🔥 Gmail SMTP for production (Render)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
});


// 🔥 Main Send Function
async function sendAlertEmail(disaster, recipients) {
  try {

    const alertUrl = "https://disaster-management-webs-4958b.web.app/liveAlerts";

    const info = await transporter.sendMail({
      from: `"Disaster Alert System" <${process.env.EMAIL_USER}>`,
      bcc: recipients, // send to many users without exposing emails
      subject: `🚨 Active Disaster Alert: ${disaster.headline}`,
      text: `
A new disaster has been marked as ACTIVE.

Headline: ${disaster.headline}
Type: ${disaster.type}
Severity: ${disaster.severity}
Location: ${disaster.location}

Reported By: ${disaster.submittedBy?.name} (${disaster.submittedBy?.email})

View full alert: ${alertUrl}
      `.trim(),
      html: `
<p>A new disaster has been marked as <strong style="color:red;">ACTIVE</strong>.</p>
<p><strong>Headline:</strong> ${disaster.headline}</p>
<p><strong>Type:</strong> ${disaster.type}</p>
<p><strong>Severity:</strong> ${disaster.severity}</p>
<p><strong>Location:</strong> ${disaster.location}</p>
<p><strong>Reported By:</strong> ${disaster.submittedBy?.name} (${disaster.submittedBy?.email})</p>
<p><a href="${alertUrl}" style="color:#d9534f;font-weight:bold">👉 View Alert Details</a></p>
      `,
    });

    console.log("✅ Email Sent:", info.messageId);

  } catch (err) {
    console.error("❌ Email Sending Failed:", err.response || err.message || err);
  }
}

module.exports = sendAlertEmail;
