// email.js
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // dynamic import for CommonJS

async function sendAlertEmail(disaster, recipients) {
  try {
    // Validate emails
    const validEmails = recipients
      .map(e => e.trim())
      .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (validEmails.length === 0) {
      console.log("❌ No valid email addresses to send alerts");
      return;
    }

    const invalidEmails = recipients.filter(e => !validEmails.includes(e));
    if (invalidEmails.length > 0) {
      console.log("❌ Invalid emails skipped:", invalidEmails);
    }

    const alertUrl = "https://disaster-management-webs-4958b.web.app/liveAlerts";

    const htmlContent = `
      <p>A new disaster has been marked as <strong style="color:red;">ACTIVE</strong>.</p>
      <p><strong>Headline:</strong> ${disaster.headline}</p>
      <p><strong>Type:</strong> ${disaster.type}</p>
      <p><strong>Severity:</strong> ${disaster.severity}</p>
      <p><strong>Location:</strong> ${disaster.location}</p>
      <p><strong>Reported By:</strong> ${disaster.submittedBy?.name} (${disaster.submittedBy?.email})</p>
      <p><a href="${alertUrl}" style="color:#d9534f;font-weight:bold">👉 View Alert Details</a></p>
    `;

    const body = {
      sender: { name: "Disaster Alert System", email: process.env.BREVO_SENDER_EMAIL },
      to: validEmails.map(email => ({ email })),
      subject: `🚨 Active Disaster Alert: ${disaster.headline}`,
      htmlContent,
    };

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    console.log("✅ Brevo API result:", result);

  } catch (err) {
    console.error("❌ Email Sending Failed:", err.response || err.message || err);
  }
}

module.exports = sendAlertEmail;
