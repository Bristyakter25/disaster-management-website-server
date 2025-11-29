const nodemailer = require("nodemailer");
require("dotenv").config();

// Gmail OAuth2 transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.SENDER_EMAIL,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  }
});

/**
 * Send email alert when disaster status becomes ACTIVE
 * @param {*} disaster - disaster object (headline, severity, type, location etc.)
 * @param {Array} recipients - list of emails to notify
 */
async function sendAlertEmail(disaster, recipients) {
  try {
    const alertUrl = "https://disaster-management-webs-4958b.web.app/liveAlerts";

    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      bcc: recipients, // sends to multiple recipients without exposing emails
      subject: `🚨 Active Disaster Alert: ${disaster.headline}`,
      text: `
Active Disaster Notification:

Headline: ${disaster.headline}
Type: ${disaster.type}
Severity: ${disaster.severity}
Location: ${disaster.location}

Reported by: ${disaster.submittedBy?.name} (${disaster.submittedBy?.email})

View full alert: ${alertUrl}
      `,
      html: `
<div style="font-family:Arial;font-size:15px">
  <p><strong style="color:red">🚨 A disaster has been marked ACTIVE</strong></p>
  <p><strong>Headline:</strong> ${disaster.headline}</p>
  <p><strong>Type:</strong> ${disaster.type}</p>
  <p><strong>Severity:</strong> ${disaster.severity}</p>
  <p><strong>Location:</strong> ${disaster.location}</p>
  <p><strong>Reported By:</strong> ${disaster.submittedBy?.name} (${disaster.submittedBy?.email})</p>
  <p><a href="${alertUrl}" target="_blank">🔗 View Full Details</a></p>
</div>
      `
    });

    console.log("📩 Alert mail sent successfully →", info.messageId);

  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
}

module.exports = sendAlertEmail;
