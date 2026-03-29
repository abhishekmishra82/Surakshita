/**
 * EmailJS — sends SOS alert emails directly from the browser.
 * Free tier: 200 emails/month, no backend needed.
 *
 * Setup (one-time, 3 minutes):
 * 1. Go to https://www.emailjs.com and sign up free
 * 2. Add Gmail as email service → connect abhishekhm76@gmail.com
 * 3. Create an email template with these variables:
 *    {{to_email}}, {{to_name}}, {{from_name}}, {{maps_link}}, {{timestamp}}
 * 4. Copy your Service ID, Template ID, and Public Key below
 */

import emailjs from '@emailjs/browser';

// ── Fill these from your EmailJS dashboard ──────────────────
const EMAILJS_SERVICE_ID  = process.env.REACT_APP_EMAILJS_SERVICE_ID  || '';
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY  || '';
// ────────────────────────────────────────────────────────────

const isConfigured = () => EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY;

export const sendSOSEmail = async ({ toEmail, toName, fromName, lat, lng }) => {
  if (!isConfigured()) {
    console.warn('EmailJS not configured — skipping browser email');
    return { success: false, reason: 'not_configured' };
  }

  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const timestamp = new Date().toLocaleString();

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email:  toEmail,
        to_name:   toName || 'Emergency Contact',
        from_name: fromName || 'Surakshita User',
        from_email: '2k23.cs2313883@gmail.com',
        maps_link: mapsLink,
        timestamp,
        message:   `🚨 EMERGENCY ALERT: ${fromName || 'A Surakshita user'} needs immediate help!\n\nLocation: ${mapsLink}\nTime: ${timestamp}\n\nPlease respond immediately or call emergency services.`,
      },
      EMAILJS_PUBLIC_KEY
    );
    console.log('✅ SOS email sent via EmailJS to', toEmail);
    return { success: true };
  } catch (err) {
    console.error('EmailJS error:', err);
    return { success: false, error: err };
  }
};
