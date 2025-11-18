const nodemailer = require("nodemailer");
require("dotenv").config();

// Gmail SMTP setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // use TLS, not SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendAlertEmail(disaster, recipients) {
  try {
    // Construct the URL to view full alert details
    const alertUrl = "https://disaster-management-webs-4958b.web.app/liveAlerts";

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      bcc: recipients,
      subject: `🚨 Active Disaster Alert: ${disaster.headline}`,
      text: `
A new disaster has been marked as ACTIVE.

Headline: ${disaster.headline}
Type: ${disaster.type}
Severity: ${disaster.severity}
Location: ${disaster.location}

Reported By: ${disaster.submittedBy?.name} (${disaster.submittedBy?.email})

Check the system for full details here: ${alertUrl}
      `,
      html: `
<p>A new disaster has been marked as <strong>ACTIVE</strong>.</p>
<p><strong>Headline:</strong> ${disaster.headline}</p>
<p><strong>Type:</strong> ${disaster.type}</p>
<p><strong>Severity:</strong> ${disaster.severity}</p>
<p><strong>Location:</strong> ${disaster.location}</p>
<p><strong>Reported By:</strong> ${disaster.submittedBy?.name} (${disaster.submittedBy?.email})</p>
<p>Check the system for full details: <a href="${alertUrl}">View Alert</a></p>
      `,
    });

    console.log("✅ Alert emails sent successfully:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send alert emails:", err);
  }
}

module.exports = sendAlertEmail;
